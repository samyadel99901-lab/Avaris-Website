/**
 * Read recent automation invoices from `paypal_invoices` (history view +
 * the page's initial server-rendered data).
 */

import { getServiceRoleClient } from "@/lib/supabase";
import type { InvoiceHistoryRow } from "@/types/automation";

interface PaypalInvoiceRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  currency: string;
  total_cents: number;
  status: "sent" | "failed";
  paypal_invoice_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export async function getInvoiceHistory(limit = 100): Promise<InvoiceHistoryRow[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("paypal_invoices")
    .select(
      "id, customer_email, customer_name, currency, total_cents, status, paypal_invoice_id, error_message, sent_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data ?? []) as PaypalInvoiceRow[]).map((r) => ({
    id: r.id,
    customerEmail: r.customer_email,
    customerName: r.customer_name,
    currency: r.currency,
    totalCents: r.total_cents,
    status: r.status,
    paypalInvoiceId: r.paypal_invoice_id,
    errorMessage: r.error_message,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  }));
}
