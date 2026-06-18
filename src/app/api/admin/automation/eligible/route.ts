import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/admin/session";
import { getEligibleInvoices } from "@/services/automation/eligibility";
import { runSync } from "@/services/monday/sync/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/admin/automation/eligible[?sync=1]
 *
 * Returns the customers eligible to be invoiced (from synced Supabase
 * data). Any logged-in admin may read. `?sync=1` runs an incremental
 * Monday sync first so the data is fresh before computing eligibility.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const wantsSync = new URL(request.url).searchParams.get("sync") === "1";

  try {
    let syncedAt: string | null = null;
    if (wantsSync) {
      await runSync({ mode: "incremental", triggeredBy: "manual_admin" });
      syncedAt = new Date().toISOString();
    }

    const result = await getEligibleInvoices();
    return NextResponse.json({ ...result, syncedAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
