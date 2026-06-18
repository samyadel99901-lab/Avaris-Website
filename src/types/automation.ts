/**
 * Types for the PayPal invoicing automation.
 *
 * Money is carried in USD **cents** end-to-end (matching the Supabase
 * `*_cents` convention); we only convert to a dollar string at the
 * PayPal API boundary.
 */

/** One video (Monday project) that will become an invoice line item. */
export interface EligibleVideo {
  mondayItemId: number;
  projectName: string;
  description: string | null;
  amountCents: number;
  /** "Not send" | "Deposit paid" — kept for display. */
  invoiceStatus: string | null;
}

/** A customer with all their eligible videos, ready to be invoiced. */
export interface EligibleCustomer {
  customerEmail: string;
  customerName: string;
  videos: EligibleVideo[];
  totalCents: number;
}

/**
 * A customer (or project) excluded from invoicing, with the reason.
 * Customer-level skips carry the offending project that triggered it.
 */
export interface AutomationWarning {
  customerName: string | null;
  customerEmail: string | null;
  reason: string;
  mondayItemId: number | null;
  projectName: string | null;
}

export interface EligibleResult {
  customers: EligibleCustomer[];
  warnings: AutomationWarning[];
  summary: {
    eligibleCount: number;
    totalCents: number;
    warningsCount: number;
  };
  /** ISO timestamp of the freshness sync run, when one was requested. */
  syncedAt: string | null;
}

/** Per-customer outcome of a send run. */
export interface SendSuccess {
  customerEmail: string;
  customerName: string;
  paypalInvoiceId: string;
  totalCents: number;
  itemsCount: number;
  /**
   * "created" → a brand-new invoice was created + sent.
   * "appended" → the customer had an unpaid invoice; the new items were
   * added to it and a reminder was sent instead of a second invoice.
   */
  action: "created" | "appended";
  /**
   * Monday item ids whose post-send status flip failed. The invoice WAS
   * sent — these just need their Monday status fixed manually. Absent/
   * empty when all flips succeeded.
   */
  mondayUpdateFailedItemIds?: number[];
}

export interface SendFailure {
  customerEmail: string;
  customerName: string;
  totalCents: number;
  reason: string;
}

export interface SendReport {
  successful: SendSuccess[];
  failed: SendFailure[];
  /** Customers requested but no longer eligible (already invoiced, etc.). */
  skipped: AutomationWarning[];
  summary: {
    requested: number;
    sent: number;
    failed: number;
    skipped: number;
  };
}

/** A row from the paypal_invoices history table (camelCased for the UI). */
export interface InvoiceHistoryRow {
  id: string;
  customerEmail: string;
  customerName: string | null;
  currency: string;
  totalCents: number;
  status: "sent" | "failed";
  paypalInvoiceId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}
