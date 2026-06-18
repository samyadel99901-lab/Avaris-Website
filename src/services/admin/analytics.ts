import type { AnalyticsSnapshot } from "@/types/admin";

/**
 * Analytics service interface — feeds the dashboard. Phase 2a returns
 * mock data; Phase 3 swaps for the Supabase adapter that aggregates
 * the `events` table.
 */
export interface AnalyticsService {
  getSnapshot(): Promise<AnalyticsSnapshot>;
}
