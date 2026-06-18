import { mockAnalytics } from "@/lib/mockData";
import type { AnalyticsService } from "./analytics";

export function createMockAnalyticsService(): AnalyticsService {
  return {
    async getSnapshot() {
      return mockAnalytics;
    },
  };
}
