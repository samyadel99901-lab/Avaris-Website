import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/admin/session";
import { getLastSyncRun } from "@/services/monday/sync/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sync-monday/status
 *
 * Returns the most-recent monday_full sync run. Any logged-in admin can
 * read — the data isn't sensitive (just stats).
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const lastRun = await getLastSyncRun();
  return NextResponse.json({ lastRun });
}
