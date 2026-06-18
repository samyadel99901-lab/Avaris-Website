import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieAttributes } from "@/lib/admin/auth-cookie";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/admin/auth/logout
 *
 * Always returns 200 — clears the session cookie regardless of whether
 * one was set. Idempotent.
 */
export async function POST() {
  const isProd = env.NODE_ENV === "production";
  const store = await cookies();
  const attrs = sessionCookieAttributes({ isProd, clear: true });
  store.set({ value: "", ...attrs });
  return NextResponse.json({ ok: true });
}
