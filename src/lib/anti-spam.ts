/**
 * Tiny in-memory rate limiter. Good enough for a single-region MVP.
 *
 * On serverless (Vercel) each cold start spins up a fresh map, so the
 * actual rate over time can drift higher than configured. Acceptable
 * for abuse mitigation; swap for Upstash Redis or Vercel KV when
 * traffic grows enough that this becomes a real attack surface.
 */

type Bucket = {
  count: number;
  /** Window start in ms (Date.now). */
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MAX = 5;

export type RateLimitConfig = {
  /** Window length in milliseconds. Default 1 hour. */
  windowMs?: number;
  /** Allowed requests per window. Default 5. */
  max?: number;
};

/**
 * Check + increment the bucket for `key`. Returns whether the request
 * is allowed; if not, the time (ms) until the window resets.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig = {},
): { ok: true } | { ok: false; retryAfterMs: number } {
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
  const max = config.max ?? DEFAULT_MAX;

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (bucket.count < max) {
    bucket.count += 1;
    return { ok: true };
  }

  const retryAfterMs = windowMs - (now - bucket.windowStart);
  return { ok: false, retryAfterMs };
}

/**
 * Best-effort client-IP extraction from common proxy headers. Falls
 * back to "anonymous" so unknown peers still bucket together (they
 * share one quota — worst case is fairness, not security).
 */
export function getClientIp(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];
  return candidates.find((v): v is string => Boolean(v)) ?? "anonymous";
}
