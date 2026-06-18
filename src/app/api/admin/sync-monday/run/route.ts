import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/admin/session";
import { runSync } from "@/services/monday/sync/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z
  .object({
    /**
     * Default "incremental" — full sync from a serverless function on
     * Hobby plan would blow past the 60s cap. Use the local script for
     * a true full sync.
     */
    mode: z.enum(["full", "incremental"]).default("incremental"),
  })
  .default({ mode: "incremental" });

/**
 * POST /api/admin/sync-monday/run
 *
 * Manual sync trigger from the admin Settings page. Super-admin only.
 * Auth check duplicates the proxy gate intentionally — defense in depth
 * against a stale cookie that survives proxy verification.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (session.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden — super admin only" },
      { status: 403 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json().catch(() => ({}));
    body = bodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  try {
    const result = await runSync({
      mode: body.mode,
      triggeredBy: "manual_admin",
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
