import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSync } from "@/services/monday/sync/runner";

/**
 * Vercel Cron entry point. Schedule lives in vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. We
 * compare in constant time and FAIL CLOSED — a missing secret or a bad/
 * absent header is 401, never skipped. To hit it manually (any env) set
 * CRON_SECRET and send the Bearer header.
 *
 * Mode: always incremental — the cron is a steady tick, not a recovery
 * tool. If the table is empty (no prior successful run), the runner
 * auto-falls-back to full per source.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — Vercel Hobby tier cap

export async function GET(request: Request): Promise<Response> {
  const expected = env.CRON_SECRET;
  // Fail closed: a missing secret OR an absent/mismatched header → 401.
  // This endpoint triggers a full Monday→Supabase sync, so it must never
  // be open. (env.ts requires CRON_SECRET in production; this is the
  // runtime backstop against any misconfig.)
  const auth = request.headers.get("authorization");
  if (!expected || !auth || !timingSafeEqual(auth, `Bearer ${expected}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync({
      mode: "incremental",
      triggeredBy: "cron",
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Constant-time compare so the check doesn't leak length via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
