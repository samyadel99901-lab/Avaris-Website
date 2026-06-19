import { env } from "@/lib/env";
import { createMockAnalyticsService } from "./analytics.mock";
import { createSupabaseAnalyticsService } from "./analytics.supabase";
import type { AnalyticsService } from "./analytics";
import { createHardcodedAuthService } from "./auth.hardcoded";
import type { AuthService } from "./auth";

// Monday-sourced services (clients / projects / reports) moved out to
// automation-standalone/. This deployed dashboard wires only auth + the
// visitor-analytics service.

let authSingleton: AuthService | null = null;
let analyticsSingleton: AnalyticsService | null = null;

const usingSupabase = (): boolean => env.ADMIN_DATA_SOURCE === "supabase";

export function getAuthService(): AuthService {
  authSingleton ??= createHardcodedAuthService();
  return authSingleton;
}

export function getAnalyticsService(): AnalyticsService {
  analyticsSingleton ??= usingSupabase()
    ? createSupabaseAnalyticsService()
    : createMockAnalyticsService();
  return analyticsSingleton;
}

export type { AuthService } from "./auth";
export type { AnalyticsService } from "./analytics";
