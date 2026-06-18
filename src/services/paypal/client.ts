/**
 * PayPal REST API v2 client (Invoicing).
 *
 * Thin wrapper around fetch — handles OAuth2 (client_credentials) token
 * fetching + caching, base-URL selection from PAYPAL_MODE, and typed
 * errors. Modeled on the Monday client (`services/monday/client.ts`).
 *
 * No SDK: PayPal's Node SDK is heavy and the two endpoints we need
 * (create invoice, send invoice) are trivial REST calls.
 */

import { env } from "@/lib/env";

export class PayPalApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "PayPalApiError";
  }
}

function baseUrl(): string {
  return env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function credentials(): { clientId: string; clientSecret: string } {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PayPalApiError(
      "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set to call PayPal.",
    );
  }
  return { clientId, clientSecret };
}

// Module-level token cache. Warm lambdas reuse it; a cold start just
// re-fetches. We refresh 60s before the real expiry for safety.
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = credentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new PayPalApiError(
      `PayPal auth failed (HTTP ${res.status}): ${
        json.error_description ?? "no access_token in response"
      }`,
      res.status,
      json,
    );
  }

  const ttlMs = (json.expires_in ?? 3000) * 1000;
  cachedToken = {
    value: json.access_token,
    expiresAt: now + Math.max(0, ttlMs - 60_000),
  };
  return cachedToken.value;
}

/**
 * Authenticated JSON request against the PayPal API. Returns the parsed
 * body (or null for empty 2xx responses). Throws PayPalApiError on non-2xx.
 */
export async function paypalFetch<T>(
  path: string,
  init: {
    method: "GET" | "POST" | "PUT";
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const detail =
      (json as { message?: string; details?: unknown } | null)?.message ??
      text ??
      "unknown error";
    throw new PayPalApiError(
      `PayPal ${init.method} ${path} failed (HTTP ${res.status}): ${detail}`,
      res.status,
      json,
    );
  }

  return json as T;
}
