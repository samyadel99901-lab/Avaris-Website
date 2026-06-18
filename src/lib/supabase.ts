import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Server-only Supabase client backed by the service-role key.
 * Bypasses RLS — never import from a client component.
 *
 * Lazy: throws only at call time if the env vars aren't set, so the
 * build can succeed without a Supabase project (mock data path).
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service-role client requires NEXT_PUBLIC_SUPABASE_URL " +
        "and SUPABASE_SERVICE_ROLE_KEY to be set.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * True when an error looks like Supabase being unreachable rather than a
 * real query error — supabase-js surfaces these as "TypeError: fetch
 * failed" or low-level network codes. Server pages use this to degrade
 * gracefully (empty/zeroed data) instead of crashing when the project is
 * paused, the URL is wrong, or there's no network.
 */
export function isSupabaseUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return (
    /fetch failed/i.test(msg) ||
    /network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(msg)
  );
}

let serviceRoleSingleton: SupabaseClient | null = null;

/**
 * Memoized service-role client. Use this for hot paths (sync runner,
 * admin services) where re-creating a client per call adds latency.
 *
 * Same throw-at-call-time semantics as `createServiceRoleClient` —
 * the build succeeds without Supabase configured.
 */
export function getServiceRoleClient(): SupabaseClient {
  serviceRoleSingleton ??= createServiceRoleClient();
  return serviceRoleSingleton;
}

/**
 * Anonymous client (RLS-protected). Reserved for future public reads.
 * Phase 2a doesn't use this anywhere yet.
 */
export function createAnonClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase anon client requires NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to be set.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
