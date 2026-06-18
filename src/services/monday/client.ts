/**
 * Monday.com GraphQL HTTP client.
 *
 * Thin wrapper around fetch — handles auth, retries, and the
 * Monday-specific error shapes we care about:
 *   - HTTP 429 / 200-with-ComplexityException → exponential backoff
 *   - HTTP 5xx + network errors → exponential backoff
 *   - HTTP 401 / GraphQL "InvalidUserId" → throw immediately (no retry)
 *
 * Cursor expiration (60s TTL) isn't handled here — callers (the sync
 * runner) detect it and restart from cursor=null.
 */

import { env } from "@/lib/env";

const MONDAY_API_URL = "https://api.monday.com/v2";
const DEFAULT_API_VERSION = "2024-10";

export class MondayApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MondayApiError";
  }
}

interface MondayResponse<T> {
  data?: T;
  errors?: { message: string; extensions?: { code?: string } }[];
  /** Top-level error_code on non-200 responses. */
  error_code?: string;
  error_message?: string;
}

interface QueryOptions {
  /** Total attempts including the first. Default 4 (1 + 3 retries). */
  maxAttempts?: number;
  /** First retry waits this many ms; doubles each subsequent retry. */
  baseDelayMs?: number;
  signal?: AbortSignal;
}

/** Sleep wrapper that respects an AbortSignal. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });
}

/**
 * Run one GraphQL query with retry/backoff. Returns `data`.
 *
 * Throws `MondayApiError` on non-retryable failures or after exhausting
 * retries. The caller decides what to do with retryable errors that
 * exceed the budget — for the sync, we record them in sync_runs and
 * surface in the response.
 */
export async function mondayQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  opts: QueryOptions = {},
): Promise<T> {
  const token = env.MONDAY_API_TOKEN;
  if (!token) {
    throw new MondayApiError(
      "MONDAY_API_TOKEN is not set — cannot reach Monday API.",
      "missing_token",
      false,
    );
  }

  const maxAttempts = opts.maxAttempts ?? 4;
  const baseDelayMs = opts.baseDelayMs ?? 1000;

  let lastErr: MondayApiError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(MONDAY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "API-Version": DEFAULT_API_VERSION,
        },
        body: JSON.stringify({ query, variables }),
        signal: opts.signal,
      });

      // 429 → always retry. 5xx → retry. 4xx (other) → fail fast.
      if (res.status === 429) {
        throw new MondayApiError(
          `Rate limited (HTTP 429) — attempt ${attempt}/${maxAttempts}`,
          "rate_limited",
          true,
          429,
        );
      }
      if (res.status >= 500) {
        throw new MondayApiError(
          `Monday server error (HTTP ${res.status}) — attempt ${attempt}/${maxAttempts}`,
          "server_error",
          true,
          res.status,
        );
      }
      if (res.status === 401 || res.status === 403) {
        throw new MondayApiError(
          `Auth failed (HTTP ${res.status}) — token invalid or scope missing`,
          "unauthorized",
          false,
          res.status,
        );
      }
      if (!res.ok) {
        throw new MondayApiError(
          `Monday request failed (HTTP ${res.status})`,
          "http_error",
          false,
          res.status,
        );
      }

      const body = (await res.json()) as MondayResponse<T>;

      // Monday returns 200 with a body-level error for complexity / rate.
      if (body.errors?.length) {
        const codes = body.errors.map((e) => e.extensions?.code).filter(Boolean);
        const messages = body.errors.map((e) => e.message).join("; ");
        const isComplexity =
          codes.includes("ComplexityException") ||
          codes.includes("ComplexityBudgetExhausted") ||
          /complexity/i.test(messages);
        if (isComplexity) {
          throw new MondayApiError(
            `Monday complexity exceeded — attempt ${attempt}/${maxAttempts}: ${messages}`,
            "complexity",
            true,
          );
        }
        throw new MondayApiError(
          `GraphQL error: ${messages}`,
          codes[0] ?? "graphql_error",
          false,
        );
      }
      if (!body.data) {
        throw new MondayApiError(
          "Empty response from Monday API",
          "empty_response",
          true,
        );
      }
      return body.data;
    } catch (err) {
      const wrapped =
        err instanceof MondayApiError
          ? err
          : new MondayApiError(
              err instanceof Error ? err.message : String(err),
              "network_error",
              true,
            );
      lastErr = wrapped;

      if (!wrapped.retryable || attempt === maxAttempts) {
        throw wrapped;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s … with ±20% jitter.
      const jitter = 0.8 + Math.random() * 0.4;
      const delay = Math.round(baseDelayMs * 2 ** (attempt - 1) * jitter);
      await sleep(delay, opts.signal);
    }
  }

  // Unreachable — the loop either returns or throws — but TS needs it.
  throw lastErr ?? new MondayApiError("unreachable", "unknown", false);
}
