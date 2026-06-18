import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/admin/session";
import { getInvoiceHistory } from "@/services/automation/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/automation/history
 *
 * Recent invoices the automation created (sent + failed). Any logged-in
 * admin may read.
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const invoices = await getInvoiceHistory();
    return NextResponse.json({ invoices });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
