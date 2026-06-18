import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/anti-spam";
import {
  SESSION_TTL_MS,
  sessionCookieAttributes,
  signSession,
} from "@/lib/admin/auth-cookie";
import { env } from "@/lib/env";
import { getAuthService } from "@/services/admin";
import type { AdminSession } from "@/types/admin";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

/**
 * POST /api/admin/auth/login
 *
 * Body: `{ email, password }`. On success: sets the HMAC-signed
 * session cookie and returns the admin profile. On failure: 401 with
 * a generic message.
 *
 * Rate-limited per-IP at 5 attempts / 15 minutes.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limiter = rateLimit(`admin-login:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000)),
        },
      },
    );
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = loginSchema.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const auth = getAuthService();
  const admin = await auth.verifyCredentials(parsed.email, parsed.password);
  if (!admin) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const session: AdminSession = {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  const cookieValue = signSession(session);

  const isProd = env.NODE_ENV === "production";
  const store = await cookies();
  const attrs = sessionCookieAttributes({
    isProd,
    expires: new Date(session.expiresAt),
  });
  store.set({ value: cookieValue, ...attrs });

  return NextResponse.json({
    admin,
    expiresAt: session.expiresAt,
  });
}
