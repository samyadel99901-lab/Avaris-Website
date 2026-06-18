import { env } from "@/lib/env";
import { createMockAnalyticsService } from "./analytics.mock";
import { createSupabaseAnalyticsService } from "./analytics.supabase";
import type { AnalyticsService } from "./analytics";
import { createHardcodedAuthService } from "./auth.hardcoded";
import type { AuthService } from "./auth";
import { createMockClientsService } from "./clients.mock";
import { createSupabaseClientsService } from "./clients.supabase";
import type { ClientsService } from "./clients";
import { createMockProjectsService } from "./projects.mock";
import { createSupabaseProjectsService } from "./projects.supabase";
import type { ProjectsService } from "./projects";
import { createMockReportsService } from "./reports.mock";
import { createSupabaseReportsService } from "./reports.supabase";
import type { ReportsService } from "./reports";

let authSingleton: AuthService | null = null;
let analyticsSingleton: AnalyticsService | null = null;
let clientsSingleton: ClientsService | null = null;
let projectsSingleton: ProjectsService | null = null;
let reportsSingleton: ReportsService | null = null;

const useSupabase = (): boolean => env.ADMIN_DATA_SOURCE === "supabase";

export function getAuthService(): AuthService {
  authSingleton ??= createHardcodedAuthService();
  return authSingleton;
}

export function getAnalyticsService(): AnalyticsService {
  analyticsSingleton ??= useSupabase()
    ? createSupabaseAnalyticsService()
    : createMockAnalyticsService();
  return analyticsSingleton;
}

export function getClientsService(): ClientsService {
  clientsSingleton ??= useSupabase()
    ? createSupabaseClientsService()
    : createMockClientsService();
  return clientsSingleton;
}

export function getProjectsService(): ProjectsService {
  projectsSingleton ??= useSupabase()
    ? createSupabaseProjectsService()
    : createMockProjectsService();
  return projectsSingleton;
}

export function getReportsService(): ReportsService {
  reportsSingleton ??= useSupabase()
    ? createSupabaseReportsService()
    : createMockReportsService();
  return reportsSingleton;
}

export type { AuthService } from "./auth";
export type { AnalyticsService } from "./analytics";
export type { ClientsService } from "./clients";
export type { ProjectsService } from "./projects";
export type { ReportsService } from "./reports";
