/**
 * Report aggregates — read by /admin/reports + the overview page.
 * All money is USD cents unless the field name says otherwise.
 */

import type { ProjectClass, ProjectVideoType } from "./projects";

export type ReportPeriod = "month" | "year" | "all";

export interface TopClient {
  clientId: string;
  name: string;
  projectCount: number;
  totalRevenueCents: number;
  avgProjectValueCents: number;
}

export interface MonthlyCount {
  /** YYYY-MM */
  month: string;
  count: number;
}

export interface VideoTypeBreakdown {
  videoType: ProjectVideoType;
  count: number;
  revenueCents: number;
}

export interface ClassBreakdown {
  class: ProjectClass;
  count: number;
  revenueCents: number;
}

export interface PopularCombination {
  class: ProjectClass;
  videoType: ProjectVideoType;
  count: number;
}

export interface MonthlyRevenue {
  /** YYYY-MM */
  month: string;
  revenueCents: number;
}

export interface RevenueBreakdown {
  /** A bucket label — either a video type or a class, depending on context. */
  bucket: string;
  revenueCents: number;
  /** 0..100 */
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  /** 0..100 */
  percentage: number;
}

/** Single object returned by ReportsService.getOverview() — for the dashboard. */
export interface ReportsOverview {
  totalActiveClients: number;
  totalActiveProjects: number;
  newClientsThisMonth: number;
  totalRevenueCentsThisMonth: number;
  topClientsThisMonth: TopClient[];
}
