/**
 * Compute which customers are eligible to be invoiced, reading the
 * already-synced Supabase `projects` / `clients` tables (not Monday live).
 *
 * Rules (confirmed with Samy):
 *   - In scope: project in an eligible Monday group AND invoice_status in
 *     the "not yet invoiced" set.
 *   - A video is COMPLETE when class + video_type + paypal_income_cents
 *     (> 0) are all present.
 *   - If ANY in-scope video of a customer is incomplete → skip the WHOLE
 *     customer (surfaced as a warning).
 *   - Amount per video = paypal_income_cents (USD cents). No fallback to
 *     Samy's PayPal or Deposit.
 *   - Group by customer email (from the linked client). A project with no
 *     linked client / email can't be invoiced → warning.
 *   - Idempotency: projects already recorded in a successful paypal_invoices
 *     row are excluded.
 */

import { getServiceRoleClient } from "@/lib/supabase";
import type {
  AutomationWarning,
  EligibleCustomer,
  EligibleResult,
  EligibleVideo,
} from "@/types/automation";
import { ELIGIBLE_GROUP_IDS, ELIGIBLE_INVOICE_STATUSES } from "./constants";

interface EligibleProjectRow {
  monday_item_id: number;
  name: string;
  code: string | null;
  class: string | null;
  video_type: string | null;
  invoice_status: string | null;
  paypal_income_cents: number | null;
  client_name_text: string | null;
  clients: { name: string | null; email: string | null } | null;
}

/** A project is complete iff class + video_type + a positive PayPal Income. */
function incompleteReason(row: EligibleProjectRow): string | null {
  if (!row.class) return "Class is empty";
  if (!row.video_type) return "Video Type is empty";
  if (!row.paypal_income_cents || row.paypal_income_cents <= 0) {
    return "PayPal Income is empty";
  }
  return null;
}

export async function getEligibleInvoices(): Promise<EligibleResult> {
  const supabase = getServiceRoleClient();

  const [projectsRes, invoicedRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "monday_item_id, name, code, class, video_type, invoice_status, paypal_income_cents, client_name_text, clients(name, email)",
      )
      .in("invoice_status", [...ELIGIBLE_INVOICE_STATUSES])
      .in("monday_group_id", [...ELIGIBLE_GROUP_IDS]),
    // Exclude ANY Monday item id that already appears on an invoice row,
    // regardless of status (pending / sent / failed). A 'failed' row can
    // still mean the PayPal invoice was actually sent (send timed out, or
    // a later step threw before the row was flipped to 'sent'), so retrying
    // it would double-invoice. For money safety we never re-send a recorded
    // set; a genuine never-sent failure is retried by deleting its row.
    supabase.from("paypal_invoices").select("monday_item_ids"),
  ]);

  if (projectsRes.error) {
    throw new Error(`eligibility: projects read failed: ${projectsRes.error.message}`);
  }
  if (invoicedRes.error) {
    throw new Error(
      `eligibility: paypal_invoices read failed: ${invoicedRes.error.message}`,
    );
  }

  const alreadyInvoiced = new Set<number>();
  for (const row of (invoicedRes.data ?? []) as { monday_item_ids: number[] | null }[]) {
    for (const id of row.monday_item_ids ?? []) alreadyInvoiced.add(id);
  }

  const rows = (projectsRes.data ?? []) as unknown as EligibleProjectRow[];

  // Bucket projects by customer email; collect no-email rows as warnings.
  const byEmail = new Map<
    string,
    { name: string; rows: EligibleProjectRow[] }
  >();
  const warnings: AutomationWarning[] = [];

  for (const row of rows) {
    if (alreadyInvoiced.has(row.monday_item_id)) continue;

    const email = row.clients?.email?.trim() ?? "";
    const name = row.clients?.name ?? row.client_name_text ?? "Unknown";

    if (!email) {
      warnings.push({
        customerName: name,
        customerEmail: null,
        reason: "No linked client email — can't invoice",
        mondayItemId: row.monday_item_id,
        projectName: row.name,
      });
      continue;
    }

    const bucket = byEmail.get(email);
    if (bucket) bucket.rows.push(row);
    else byEmail.set(email, { name, rows: [row] });
  }

  const customers: EligibleCustomer[] = [];

  for (const [email, { name, rows: customerRows }] of byEmail) {
    // Skip the WHOLE customer if any of their in-scope videos is incomplete.
    const offending = customerRows
      .map((r) => ({ row: r, reason: incompleteReason(r) }))
      .find((x) => x.reason !== null);

    if (offending) {
      warnings.push({
        customerName: name,
        customerEmail: email,
        reason: `Customer skipped — "${offending.row.name}": ${offending.reason}`,
        mondayItemId: offending.row.monday_item_id,
        projectName: offending.row.name,
      });
      continue;
    }

    const videos: EligibleVideo[] = customerRows.map((r) => ({
      mondayItemId: r.monday_item_id,
      projectName: r.name,
      description: r.code,
      amountCents: r.paypal_income_cents as number,
      invoiceStatus: r.invoice_status,
    }));
    const totalCents = videos.reduce((s, v) => s + v.amountCents, 0);

    customers.push({ customerEmail: email, customerName: name, videos, totalCents });
  }

  // Stable, predictable ordering for the UI.
  customers.sort((a, b) => a.customerName.localeCompare(b.customerName));

  const totalCents = customers.reduce((s, c) => s + c.totalCents, 0);

  return {
    customers,
    warnings,
    summary: {
      eligibleCount: customers.length,
      totalCents,
      warningsCount: warnings.length,
    },
    syncedAt: null,
  };
}
