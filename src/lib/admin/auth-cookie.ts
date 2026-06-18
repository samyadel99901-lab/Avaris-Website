import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { AdminSession } from "@/types/admin";

export const SESSION_COOKIE_NAME = "avaris_admin_session";
export const SESSION_TTL_DAYS = 7;
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Sign an `AdminSession` payload into a self-contained cookie value:
 *   `<base64url(payload)>.<base64url(hmac-sha256(payload))>`
 *
 * The signature commits to the entire payload so any field tampering
 * (role escalation, expiry extension) makes verification fail.
 */
export function signSession(session: AdminSession): string {
  const payload = b64url(Buffer.from(JSON.stringify(session)));
  const sig = b64url(hmac(payload));
  return `${payload}.${sig}`;
}

/**
 * Verify a cookie value. Returns the parsed session on success, null
 * on signature failure, malformed input, or expired sessions.
 */
export function verifySession(value: string | null | undefined): AdminSession | null {
  if (!value || typeof value !== "string") return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  // Constant-time HMAC compare.
  const expected = b64url(hmac(payload));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: AdminSession;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed.adminId || !parsed.email || !parsed.expiresAt) return null;

  const now = Date.now();
  const exp = Date.parse(parsed.expiresAt);
  if (Number.isNaN(exp) || exp <= now) return null;

  return parsed;
}

/** Default cookie attributes used by login + logout routes. */
export function sessionCookieAttributes(opts: {
  isProd: boolean;
  expires?: Date;
  clear?: boolean;
}) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: opts.isProd,
    sameSite: "lax" as const,
    path: "/",
    expires: opts.clear ? new Date(0) : opts.expires,
    maxAge: opts.clear ? 0 : Math.floor(SESSION_TTL_MS / 1000),
  };
}

// ── Internals ──────────────────────────────────────────────────────────
function hmac(payload: string): Buffer {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest();
}

function b64url(input: Buffer): string {
  return input.toString("base64url");
}
