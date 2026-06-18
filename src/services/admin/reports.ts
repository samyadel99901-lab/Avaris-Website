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

/**
 * Aggregated reads for /admin/reports + /admin/overview KPI cards.
 * All money is USD cents unless the field name says otherwise.
 */
export interface ReportsService {
  getOverview(): Promise<ReportsOverview>;

  /** Top clients by project count for the given period. */
  getTopClientsByProjectCount(
    period: ReportPeriod,
    limit: number,
  ): Promise<TopClient[]>;

  /** Top clients by revenue for the given period. */
  getTopClientsByRevenue(
    period: ReportPeriod,
    limit: number,
  ): Promise<TopClient[]>;

  /** New clients per month for the last N months (newest last). */
  getNewClientsByMonth(months: number): Promise<MonthlyCount[]>;

  /** Project counts + revenue grouped by video_type. */
  getCountByVideoType(period: ReportPeriod): Promise<VideoTypeBreakdown[]>;

  /** Project counts + revenue grouped by class. */
  getCountByClass(period: ReportPeriod): Promise<ClassBreakdown[]>;

  /** class × video_type matrix — most popular combinations. */
  getPopularCombinations(
    period: ReportPeriod,
    limit: number,
  ): Promise<PopularCombination[]>;

  /** Revenue trend per month for the last N months. */
  getRevenueTrend(months: number): Promise<MonthlyRevenue[]>;

  /** Revenue split by video type for the given period. */
  getRevenueByVideoType(period: ReportPeriod): Promise<RevenueBreakdown[]>;

  /** Revenue split by class for the given period. */
  getRevenueByClass(period: ReportPeriod): Promise<RevenueBreakdown[]>;

  /** Distribution of all projects across status labels. */
  getStatusDistribution(): Promise<StatusDistribution[]>;
}
