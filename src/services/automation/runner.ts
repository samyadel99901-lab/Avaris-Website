/**
 * Send orchestration for the invoicing automation.
 *
 * For each requested customer: recompute eligibility (never trust the
 * client's stale list), create + send a PayPal invoice, flip each Monday
 * project's status so it can't be re-invoiced, and record the result in
 * `paypal_invoices` (history + idempotency).
 *
 * Failures are isolated per customer — one bad invoice doesn't abort the
 * batch. A time budget keeps the whole run inside the serverless cap.
 */

import { getServiceRoleClient } from "@/lib/supabase";
import { setInvoiceStatus } from "@/services/monday/mutations";
import {
  appendItemsAndRemind,
  createDraftInvoice,
  findOutstandingInvoiceId,
  sendInvoice,
} from "@/services/paypal/invoices";
import type {
  AutomationWarning,
  EligibleCustomer,
  SendFailure,
  SendReport,
  SendSuccess,
} from "@/types/automation";
import { SEND_TIME_BUDGET_MS } from "./constants";
import { getEligibleInvoices } from "./eligibility";

const CURRENCY = "USD";

interface RunSendOptions {
  emails: string[];
  triggeredBy?: "manual_admin" | "cron";
}

export async function runSend({
  emails,
  triggeredBy = "manual_admin",
}: RunSendOptions): Promise<SendReport> {
  const supabase = getServiceRoleClient();
  const startedAt = Date.now();

  const { customers } = await getEligibleInvoices();
  const byEmail = new Map<string, EligibleCustomer>(
    customers.map((c) => [c.customerEmail, c]),
  );

  const successful: SendSuccess[] = [];
  const failed: SendFailure[] = [];
  const skipped: AutomationWarning[] = [];

  const requested = Array.from(new Set(emails.map((e) => e.trim()).filter(Boolean)));

  for (const email of requested) {
    const customer = byEmail.get(email);

    // No longer eligible (already invoiced, became incomplete, etc.).
    if (!customer) {
      skipped.push({
        customerName: null,
        customerEmail: email,
        reason: "No longer eligible (already invoiced or data changed)",
        mondayItemId: null,
        projectName: null,
      });
      continue;
    }

    // Out of time — leave the rest for another run rather than risk a
    // mid-flight timeout.
    if (Date.now() - startedAt > SEND_TIME_BUDGET_MS) {
      skipped.push({
        customerName: customer.customerName,
        customerEmail: email,
        reason: "Time budget reached — run again to send the rest",
        mondayItemId: null,
        projectName: null,
      });
      continue;
    }

    const lineItems = customer.videos.map((v) => ({
      monday_item_id: v.mondayItemId,
      project_name: v.projectName,
      description: v.description,
      amount_cents: v.amountCents,
    }));

    // Stable key over the SORTED Monday item ids. The partial unique
    // index on (dedupe_key) WHERE status <> 'failed' makes two concurrent
    // runs for the same set collide on insert → the second is rejected,
    // so a customer can't be double-invoiced even under a real race.
    const dedupeKey = customer.videos
      .map((v) => v.mondayItemId)
      .sort((a, b) => a - b)
      .join(",");

    // ── Reserve a DB row BEFORE any PayPal call ──────────────────────
    // A send must NEVER happen without a record. We insert a 'pending'
    // row first; if that insert fails we skip the customer entirely (no
    // PayPal call). The SAME row is then flipped to sent/failed below.
    const { data: reserved, error: reserveErr } = await supabase
      .from("paypal_invoices")
      .insert({
        customer_email: customer.customerEmail,
        customer_name: customer.customerName,
        currency: CURRENCY,
        total_cents: customer.totalCents,
        status: "pending",
        monday_item_ids: customer.videos.map((v) => v.mondayItemId),
        dedupe_key: dedupeKey,
        line_items: lineItems,
        triggered_by: triggeredBy,
      })
      .select("id")
      .single();

    if (reserveErr || !reserved) {
      // 23505 = unique_violation: another concurrent run already claimed
      // this exact set of items. Skip it (do NOT send), don't fail it.
      if (reserveErr?.code === "23505") {
        skipped.push({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          reason: "Already being invoiced by a concurrent run",
          mondayItemId: null,
          projectName: null,
        });
      } else {
        // Couldn't reserve a row → do NOT send (no record would exist).
        failed.push({
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          totalCents: customer.totalCents,
          reason: `Could not record invoice before sending: ${
            reserveErr?.message ?? "unknown DB error"
          }`,
        });
      }
      continue;
    }
    const rowId = reserved.id as string;

    try {
      const newItems = customer.videos.map((v) => ({
        name: v.projectName,
        description: v.description,
        amountCents: v.amountCents,
      }));

      // Does this customer already owe us on an unpaid invoice? If so,
      // append to it + remind; otherwise create a fresh invoice + send.
      const outstandingId = await findOutstandingInvoiceId(
        customer.customerEmail,
      );

      let paypalInvoiceId: string;
      let action: "created" | "appended";

      if (outstandingId) {
        await appendItemsAndRemind(outstandingId, CURRENCY, newItems);
        paypalInvoiceId = outstandingId;
        action = "appended";
      } else {
        paypalInvoiceId = await createDraftInvoice({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          currency: CURRENCY,
          items: newItems,
          requestId: rowId,
        });
        await sendInvoice(paypalInvoiceId);
        action = "created";
      }

      // Sent/updated — flip the SAME reserved row to 'sent', then flip
      // Monday statuses best-effort.
      await supabase
        .from("paypal_invoices")
        .update({
          status: "sent",
          paypal_invoice_id: paypalInvoiceId,
          sent_at: new Date().toISOString(),
          line_items: lineItems.map((li) => ({ ...li, action })),
        })
        .eq("id", rowId);

      const flipResults = await Promise.allSettled(
        customer.videos.map((v) => setInvoiceStatus(v.mondayItemId)),
      );
      const mondayFailedItemIds = customer.videos
        .filter((_, i) => flipResults[i]?.status === "rejected")
        .map((v) => v.mondayItemId);
      if (mondayFailedItemIds.length > 0) {
        const detail = flipResults
          .map((r, i) =>
            r.status === "rejected"
              ? `${customer.videos[i]?.mondayItemId}: ${
                  r.reason instanceof Error ? r.reason.message : String(r.reason)
                }`
              : null,
          )
          .filter(Boolean)
          .join("; ");
        // Invoice WAS sent — this is a visibility issue only (no re-send;
        // eligibility excludes by DB invoice record, not Monday status).
        console.warn(
          `[automation] invoice ${paypalInvoiceId} sent, but Monday status ` +
            `flip failed for ${mondayFailedItemIds.length} item(s): ${detail}`,
        );
      }

      successful.push({
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        paypalInvoiceId,
        totalCents: customer.totalCents,
        itemsCount: customer.videos.length,
        action,
        mondayUpdateFailedItemIds:
          mondayFailedItemIds.length > 0 ? mondayFailedItemIds : undefined,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);

      // Flip the SAME reserved row to 'failed' (don't create a 2nd row;
      // don't block on update errors).
      await supabase
        .from("paypal_invoices")
        .update({ status: "failed", error_message: reason })
        .eq("id", rowId)
        .then(
          () => {},
          () => {},
        );

      failed.push({
        customerEmail: customer.customerEmail,
        customerName: customer.customerName,
        totalCents: customer.totalCents,
        reason,
      });
    }
  }

  return {
    successful,
    failed,
    skipped,
    summary: {
      requested: requested.length,
      sent: successful.length,
      failed: failed.length,
      skipped: skipped.length,
    },
  };
}
