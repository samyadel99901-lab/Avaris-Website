import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySession,
} from "@/lib/admin/auth-cookie";

// R2 video bucket origin, derived from NEXT_PUBLIC_VIDEO_BASE_URL. Added to
// the CSP media-src so <video> can load from R2. Empty when unset (videos
// served locally from /public → 'self' already covers them). Computed once.
const R2_MEDIA_ORIGIN = (() => {
  try {
    const raw = process.env.NEXT_PUBLIC_VIDEO_BASE_URL;
    return raw ? new URL(raw).origin : "";
  } catch {
    return "";
  }
})();

// Next.js 16: proxy.ts always runs on the Node.js runtime — no
// runtime export allowed. `Buffer` and `node:crypto` work natively.

/**
 * Per-request CSP with a fresh nonce + admin route gate.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy` —
 * same NextRequest / NextResponse APIs, same matcher config.
 *
 * Dev:  allows 'unsafe-inline' + 'unsafe-eval' for HMR/Fast Refresh.
 * Prod: nonce-based + 'strict-dynamic'. NO 'unsafe-inline' — Next.js
 *       picks up the nonce from the `x-nonce` request header and
 *       applies it to its own injected hydration scripts automatically.
 *
 * Admin gate:
 *   /admin/login  + no session     → continue
 *   /admin/login  + valid session  → 302 /admin/analytics
 *   /admin/*      + no session     → 302 /admin/login?next=…
 *   /admin        + valid session  → 302 /admin/analytics
 *
 * All other static headers (HSTS, X-Frame-Options, Referrer-Policy,
 * Permissions-Policy, etc.) live in next.config.ts.
 */
export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const pathname = request.nextUrl.pathname;

  // ── CSRF: same-origin gate for state-changing admin API calls ────────
  // proxy() runs on /api/admin/* (see matcher). For unsafe methods we
  // require the Origin header's host to equal this site's host. The admin
  // UI's same-origin fetches always send a matching Origin; a cross-site
  // forgery can't. Read-only GETs are unaffected. Defense in depth on top
  // of the sameSite=lax session cookie. No env config — the host is derived
  // from the request, so it works in dev / preview / prod.
  if (pathname.startsWith("/api/admin")) {
    const method = request.method;
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const origin = request.headers.get("origin");
      const host =
        request.headers.get("x-forwarded-host") ?? request.headers.get("host");
      let originHost: string | null = null;
      try {
        originHost = origin ? new URL(origin).host : null;
      } catch {
        originHost = null;
      }
      if (!originHost || !host || originHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin request blocked" },
          { status: 403 },
        );
      }
    }
    return NextResponse.next();
  }

  // ── Admin auth gate ─────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySession(cookie);
    const isLoginPage = pathname === "/admin/login";

    if (!session && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session && (isLoginPage || pathname === "/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/analytics";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Vercel Analytics (script + beacon) and Supabase (REST + realtime).
  const vercelScripts = "https://va.vercel-scripts.com";
  const vercelBeacon = "https://vitals.vercel-insights.com";
  const supabaseHosts = "https://*.supabase.co wss://*.supabase.co";

  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${vercelScripts}`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' ${vercelScripts}`;

  const connectSrc = isDev
    ? `'self' ws: wss: ${vercelBeacon} ${supabaseHosts}`
    : `'self' ${vercelBeacon} ${supabaseHosts}`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // Framer Motion / Lenis set inline style attributes on elements;
    // 'unsafe-inline' is unavoidable for style-src in this stack.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `media-src 'self' blob:${R2_MEDIA_ORIGIN ? ` ${R2_MEDIA_ORIGIN}` : ""}`,
    // The "Submit a new project" dialog embeds a monday.com WorkForm.
    `frame-src 'self' https://*.monday.com`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  // Pass nonce into the request so Server Components / Next.js itself
  // can read it via headers() and apply it to inline <script> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Skip static assets and images — CSP doesn't apply to them and
  // running proxy on every chunk request hurts dev perf.
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    // Admin API routes — for the same-origin (CSRF) gate above. Other /api
    // paths (cron, contact, track) stay excluded.
    "/api/admin/:path*",
  ],
};
