import type {
  ClassBreakdown,
  MonthlyCount,
  MonthlyRevenue,
  PopularCombination,
  ReportPeriod,
  ReportsOverview,
  RevenueBreakdown,
  StatusDistribution,
  TopClient,
  VideoTypeBreakdown,
} from "@/types/reports";
import type { ReportsService } from "./reports";

/**
 * Deterministic mock for reports — used when ADMIN_DATA_SOURCE=mock.
 * Numbers are made up but realistic-looking so the UI is exercisable.
 */
export function createMockReportsService(): ReportsService {
  const TOP_CLIENTS_MONTH: TopClient[] = [
    { clientId: "mock_001", name: "Olivia Bennett", projectCount: 4, totalRevenueCents: 850_000, avgProjectValueCents: 212_500 },
    { clientId: "mock_006", name: "Noah Williams",  projectCount: 3, totalRevenueCents: 540_000, avgProjectValueCents: 180_000 },
    { clientId: "mock_003", name: "Sofia Reyes",    projectCount: 2, totalRevenueCents: 320_000, avgProjectValueCents: 160_000 },
    { clientId: "mock_009", name: "Amelia Cruz",    projectCount: 2, totalRevenueCents: 280_000, avgProjectValueCents: 140_000 },
    { clientId: "mock_002", name: "Marcus Chen",    projectCount: 1, totalRevenueCents: 120_000, avgProjectValueCents: 120_000 },
  ];
  const TOP_CLIENTS_YEAR: TopClient[] = [
    { clientId: "mock_001", name: "Olivia Bennett", projectCount: 28, totalRevenueCents: 6_200_000, avgProjectValueCents: 221_000 },
    { clientId: "mock_006", name: "Noah Williams",  projectCount: 19, totalRevenueCents: 3_900_000, avgProjectValueCents: 205_000 },
    { clientId: "mock_003", name: "Sofia Reyes",    projectCount: 16, totalRevenueCents: 2_800_000, avgProjectValueCents: 175_000 },
    { clientId: "mock_009", name: "Amelia Cruz",    projectCount: 14, totalRevenueCents: 2_100_000, avgProjectValueCents: 150_000 },
    { clientId: "mock_005", name: "Aisha Patel",    projectCount: 11, totalRevenueCents: 1_500_000, avgProjectValueCents: 136_000 },
  ];

  return {
    async getOverview(): Promise<ReportsOverview> {
      return {
        totalActiveClients: 287,
        totalActiveProjects: 142,
        newClientsThisMonth: 8,
        totalRevenueCentsThisMonth: 4_320_000,
        topClientsThisMonth: TOP_CLIENTS_MONTH,
      };
    },

    async getTopClientsByProjectCount(
      period: ReportPeriod,
      limit: number,
    ): Promise<TopClient[]> {
      const src = period === "month" ? TOP_CLIENTS_MONTH : TOP_CLIENTS_YEAR;
      return [...src]
        .sort((a, b) => b.projectCount - a.projectCount)
        .slice(0, limit);
    },

    async getTopClientsByRevenue(
      period: ReportPeriod,
      limit: number,
    ): Promise<TopClient[]> {
      const src = period === "month" ? TOP_CLIENTS_MONTH : TOP_CLIENTS_YEAR;
      return [...src]
        .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
        .slice(0, limit);
    },

    async getNewClientsByMonth(months: number): Promise<MonthlyCount[]> {
      const counts = [3, 5, 4, 6, 9, 7, 11, 8, 12, 10, 14, 8].slice(-months);
      return monthlyBuckets(months).map((m, i) => ({
        month: m,
        count: counts[i] ?? 0,
      }));
    },

    async getCountByVideoType(): Promise<VideoTypeBreakdown[]> {
      return [
        { videoType: "reel_short",  count: 42, revenueCents: 2_100_000 },
        { videoType: "video_short", count: 31, revenueCents: 1_700_000 },
        { videoType: "reel_long",   count: 18, revenueCents: 1_400_000 },
        { videoType: "video_long",  count: 14, revenueCents: 1_200_000 },
        { videoType: "photo",       count: 8,  revenueCents: 240_000 },
        { videoType: "other",       count: 3,  revenueCents: 80_000 },
      ];
    },

    async getCountByClass(): Promise<ClassBreakdown[]> {
      return [
        { class: "A", count: 58, revenueCents: 4_800_000 },
        { class: "B", count: 47, revenueCents: 1_700_000 },
        { class: "C", count: 11, revenueCents: 220_000 },
      ];
    },

    async getPopularCombinations(
      _period: ReportPeriod,
      limit: number,
    ): Promise<PopularCombination[]> {
      const all: PopularCombination[] = [
        { class: "A", videoType: "reel_short",  count: 24 },
        { class: "A", videoType: "video_short", count: 18 },
        { class: "B", videoType: "reel_short",  count: 16 },
        { class: "A", videoType: "reel_long",   count: 11 },
        { class: "B", videoType: "video_short", count: 9 },
        { class: "A", videoType: "video_long",  count: 8 },
      ];
      return all.slice(0, limit);
    },

    async getRevenueTrend(months: number): Promise<MonthlyRevenue[]> {
      const series = [
        2_100_000, 2_400_000, 2_800_000, 3_100_000, 2_900_000, 3_400_000,
        3_700_000, 3_500_000, 4_100_000, 4_300_000, 4_600_000, 4_320_000,
      ].slice(-months);
      return monthlyBuckets(months).map((m, i) => ({
        month: m,
        revenueCents: series[i] ?? 0,
      }));
    },

    async getRevenueByVideoType(): Promise<RevenueBreakdown[]> {
      const total = 6_720_000;
      return [
        { bucket: "reel_short",  revenueCents: 2_100_000, percentage: 31.25 },
        { bucket: "video_short", revenueCents: 1_700_000, percentage: 25.30 },
        { bucket: "reel_long",   revenueCents: 1_400_000, percentage: 20.83 },
        { bucket: "video_long",  revenueCents: 1_200_000, percentage: 17.86 },
        { bucket: "photo",       revenueCents:   240_000, percentage:  3.57 },
        { bucket: "other",       revenueCents:    80_000, percentage:  1.19 },
      ].map((b) => ({ ...b, percentage: (b.revenueCents / total) * 100 }));
    },

    async getRevenueByClass(): Promise<RevenueBreakdown[]> {
      const total = 6_720_000;
      return [
        { bucket: "A", revenueCents: 4_800_000, percentage: 0 },
        { bucket: "B", revenueCents: 1_700_000, percentage: 0 },
        { bucket: "C", revenueCents: 220_000, percentage: 0 },
      ].map((b) => ({ ...b, percentage: (b.revenueCents / total) * 100 }));
    },

    async getStatusDistribution(): Promise<StatusDistribution[]> {
      const counts: Array<[string, number]> = [
        ["Done", 320],
        ["In progress", 84],
        ["Waiting", 42],
        ["Revisions", 31],
        ["Ready For Approval", 18],
        ["Archived", 14],
        ["Sent", 9],
      ];
      const total = counts.reduce((s, [, c]) => s + c, 0);
      return counts.map(([status, count]) => ({
        status,
        count,
        percentage: (count / total) * 100,
      }));
    },
  };
}

function monthlyBuckets(months: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
