/**
 * PayPal Invoicing — create a draft then send it (the two-step flow the
 * Laravel automation used). Amounts come in as USD cents and are
 * formatted to a 2-dp string only here, at the API boundary.
 */

import { PayPalApiError, paypalFetch } from "./client";

export interface PayPalLineItem {
  name: string;
  description: string | null;
  amountCents: number;
}

export interface CreateInvoiceInput {
  customerName: string;
  customerEmail: string;
  currency: string;
  items: PayPalLineItem[];
  /**
   * Stable id sent as `PayPal-Request-Id` so PayPal dedupes a retried
   * create (e.g. our request timed out but PayPal already made the
   * invoice). Pass the reserved DB row id.
   */
  requestId?: string;
}

/** cents → "12.34" */
function centsToValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CreateInvoiceResponse {
  id?: string;
  href?: string;
}

/**
 * Create a DRAFT invoice. Returns the PayPal invoice id.
 *
 * `Prefer: return=representation` makes PayPal echo the created invoice
 * so we can read `id` directly; we fall back to parsing it off `href`.
 */
export async function createDraftInvoice(
  input: CreateInvoiceInput,
): Promise<string> {
  const payload = {
    detail: { currency_code: input.currency },
    primary_recipients: [
      {
        billing_info: {
          name: { given_name: input.customerName },
          email_address: input.customerEmail,
        },
      },
    ],
    items: input.items.map((item) => ({
      name: item.name,
      description: item.description ?? "",
      quantity: "1",
      unit_amount: {
        currency_code: input.currency,
        value: centsToValue(item.amountCents),
      },
    })),
  };

  const headers: Record<string, string> = { Prefer: "return=representation" };
  if (input.requestId) headers["PayPal-Request-Id"] = input.requestId;

  const res = await paypalFetch<CreateInvoiceResponse>("/v2/invoicing/invoices", {
    method: "POST",
    headers,
    body: payload,
  });

  const id = res.id ?? (res.href ? res.href.split("/").pop() : undefined);
  if (!id) {
    throw new PayPalApiError(
      "PayPal create invoice returned no id/href.",
      undefined,
      res,
    );
  }
  return id;
}

/** Send a created invoice to the recipient (not back to the invoicer). */
export async function sendInvoice(invoiceId: string): Promise<void> {
  await paypalFetch(`/v2/invoicing/invoices/${invoiceId}/send`, {
    method: "POST",
    body: { send_to_invoicer: false, send_to_recipient: true },
  });
}

// ── Outstanding-invoice handling ──────────────────────────────────────
//
// Before invoicing a customer we check whether they ALREADY have an
// unpaid invoice we sent. If so, we append the new line items to that
// invoice and send a reminder instead of creating a second one — so the
// customer gets a single running invoice, not a pile of separate ones.

/** PayPal statuses that count as "still owed" (not paid/cancelled/draft). */
const OUTSTANDING_STATUSES = ["SENT", "SCHEDULED", "PARTIALLY_PAID"] as const;

interface SearchInvoiceItem {
  id: string;
  status: string;
}
interface SearchInvoicesResponse {
  items?: SearchInvoiceItem[];
  total_pages?: number;
}

/**
 * Find an outstanding (unpaid) invoice for a recipient email, if any.
 * Returns the PayPal invoice id, or null when the customer is all-clear.
 *
 * search-invoices filters server-side by recipient_email + status, so the
 * result is already just this customer's outstanding invoices. We still
 * page (bounded) in case a customer has more than one page of them, to be
 * sure we never miss an existing invoice and create a duplicate.
 */
export async function findOutstandingInvoiceId(
  email: string,
): Promise<string | null> {
  const PAGE_SIZE = 100; // PayPal's max per page
  const MAX_PAGES = 5; // safety cap → up to 500 of THIS customer's invoices

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await paypalFetch<SearchInvoicesResponse>(
      `/v2/invoicing/search-invoices?page=${page}&page_size=${PAGE_SIZE}&total_required=true`,
      {
        method: "POST",
        body: { recipient_email: email, status: [...OUTSTANDING_STATUSES] },
      },
    );

    const items = res.items ?? [];
    const match = items.find((i) =>
      (OUTSTANDING_STATUSES as readonly string[]).includes(i.status),
    );
    if (match) return match.id;

    // Stop at the last page.
    if (items.length < PAGE_SIZE) break;
    if (res.total_pages && page >= res.total_pages) break;
  }

  return null;
}

/** A PayPal invoice resource — only the parts we read/rewrite are typed. */
interface PayPalInvoice {
  id?: string;
  detail?: Record<string, unknown> & { metadata?: unknown };
  invoicer?: unknown;
  primary_recipients?: unknown;
  additional_recipients?: unknown;
  items?: unknown[];
  configuration?: unknown;
  [k: string]: unknown;
}

export async function getInvoice(invoiceId: string): Promise<PayPalInvoice> {
  return paypalFetch<PayPalInvoice>(`/v2/invoicing/invoices/${invoiceId}`, {
    method: "GET",
  });
}

/**
 * Append items to an existing (unpaid) invoice and remind the recipient.
 *
 * PayPal's update is a FULL replace, so we fetch the invoice, keep its
 * writable sections (dropping read-only fields like id/status/links/
 * amount/metadata that the API rejects), append our new items, PUT it
 * back, then send a reminder so the customer sees the new total.
 */
export async function appendItemsAndRemind(
  invoiceId: string,
  currency: string,
  newItems: PayPalLineItem[],
): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  const existingItems = Array.isArray(invoice.items) ? invoice.items : [];

  const appendedItems = [
    ...existingItems,
    ...newItems.map((item) => ({
      name: item.name,
      description: item.description ?? "",
      quantity: "1",
      unit_amount: {
        currency_code: currency,
        value: centsToValue(item.amountCents),
      },
    })),
  ];

  // `detail` carries read-only metadata (create_time, etc.) that PUT
  // rejects — strip it.
  const detail = invoice.detail ? { ...invoice.detail } : undefined;
  if (detail) delete detail.metadata;

  const body = {
    detail,
    invoicer: invoice.invoicer,
    primary_recipients: invoice.primary_recipients,
    additional_recipients: invoice.additional_recipients,
    items: appendedItems,
    configuration: invoice.configuration,
  };

  await paypalFetch(
    `/v2/invoicing/invoices/${invoiceId}?send_to_recipient=false`,
    { method: "PUT", body },
  );

  await remindInvoice(invoiceId);
}

/** Send a payment reminder for an already-sent invoice. */
export async function remindInvoice(invoiceId: string): Promise<void> {
  await paypalFetch(`/v2/invoicing/invoices/${invoiceId}/remind`, {
    method: "POST",
    body: {
      subject: "Reminder: your AVARIS invoice was updated",
      note: "We've added new item(s) to your invoice. Please review and complete payment.",
      send_to_recipient: true,
    },
  });
}
