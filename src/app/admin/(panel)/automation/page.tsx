import { redirect } from "next/navigation";
import { AutomationClient } from "@/components/admin/automation/AutomationClient";
import { getServerSession } from "@/lib/admin/session";
import { getAuthService } from "@/services/admin";
import { getEligibleInvoices } from "@/services/automation/eligibility";
import { getInvoiceHistory } from "@/services/automation/history";
import type { EligibleResult, InvoiceHistoryRow } from "@/types/automation";

export const metadata = { title: "Automation" };
export const dynamic = "force-dynamic";

/**
 * /admin/automation — PayPal invoicing automation.
 *
 * Initial eligible list + history are computed server-side (like the
 * other admin pages). The client only refetches on user actions (refresh,
 * send). Any admin can view; sending is super-admin only (enforced by the
 * API; the UI disables the button otherwise).
 */
export default async function AutomationPage() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");

  const admin = await getAuthService().getAdmin(session.adminId);
  if (!admin) redirect("/admin/login");

  // Best-effort — don't break the page if Supabase isn't configured.
  let initialData: EligibleResult | null = null;
  let initialError: string | null = null;
  let initialHistory: InvoiceHistoryRow[] = [];
  try {
    [initialData, initialHistory] = await Promise.all([
      getEligibleInvoices(),
      getInvoiceHistory(),
    ]);
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <AutomationClient
      isSuperAdmin={admin.role === "super_admin"}
      initialData={initialData}
      initialError={initialError}
      initialHistory={initialHistory}
    />
  );
}
