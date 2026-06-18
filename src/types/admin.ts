export type AdminRole = "admin" | "super_admin";

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/** Cookie payload — what we sign + store in the session cookie. */
export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  /** ISO 8601 — cookie maxAge tracks this too. */
  expiresAt: string;
}

// ── Analytics aggregates ────────────────────────────────────────────
export type Period = "week" | "month" | "year";

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface VideoMetrics {
  videoSrc: string;
  videoLabel: string;
  views: number;
  uniqueViewers: number;
  avgWatchPercent: number;
  completionRate: number;
}

export interface CtaMetrics {
  label: string;
  location: string;
  count: number;
  uniqueClicks: number;
}

export interface ScrollDepthDistribution {
  sectionId: string;
  label: string;
  reachedPct: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
  percentage: number;
}

export type Device = "mobile" | "desktop" | "tablet";

export interface DeviceBreakdown {
  device: Device;
  visits: number;
  percentage: number;
}

export interface TopReferrer {
  domain: string;
  count: number;
}

export type RecentEventType =
  | "page_view"
  | "video_play"
  | "video_progress"
  | "cta_click"
  | "scroll_depth"
  | "external_link";

export interface RecentEvent {
  id: string;
  createdAt: string;
  eventType: RecentEventType;
  path: string;
  summary: string;
}

export interface AnalyticsSnapshot {
  totalVisitorsLast30d: number;
  topVideo: { label: string; views: number } | null;
  pageViewsTrend: TrendPoint[];
  videoMetrics: VideoMetrics[];
  topCtas: CtaMetrics[];
  scrollDepth: ScrollDepthDistribution[];
  trafficSources: TrafficSource[];
  devices: DeviceBreakdown[];
  topReferrers: TopReferrer[];
  recentEvents: RecentEvent[];
}
