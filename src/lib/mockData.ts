import type {
  AnalyticsSnapshot,
  CtaMetrics,
  DeviceBreakdown,
  RecentEvent,
  ScrollDepthDistribution,
  TopReferrer,
  TrafficSource,
  TrendPoint,
  VideoMetrics,
} from "@/types/admin";

/**
 * Deterministic mock data for the admin dashboard. Values are committed
 * so charts stay stable across reloads. Replace adapters with real
 * Supabase / Monday queries in Phase 3 / Phase 4 — types stay identical.
 */

// ── Analytics ─────────────────────────────────────────────────────────
const buildTrend = (
  dailyCounts: number[],
  startDaysAgo = 29,
): TrendPoint[] => {
  const out: TrendPoint[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < dailyCounts.length; i += 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (startDaysAgo - i));
    out.push({
      date: d.toISOString().slice(0, 10),
      count: dailyCounts[i],
    });
  }
  return out;
};

// 30-day curve, 80–250 range, weekend dips on Fri/Sat (by-eye realistic)
const PAGE_VIEWS_TREND: TrendPoint[] = buildTrend([
  142, 118, 96, 178, 195, 102, 88, 165, 174, 182, 209, 224, 134, 109,
  187, 215, 238, 226, 251, 161, 122, 198, 211, 232, 248, 246, 158, 131,
  204, 219,
]);

const VIDEO_METRICS: VideoMetrics[] = [
  {
    videoSrc: "/video-production/cinematic.mp4",
    videoLabel: "Cinematic Edits",
    views: 1284,
    uniqueViewers: 967,
    avgWatchPercent: 62,
    completionRate: 38,
  },
  {
    videoSrc: "/video-production/lifestyle.mp4",
    videoLabel: "Lifestyle Edits",
    views: 982,
    uniqueViewers: 754,
    avgWatchPercent: 58,
    completionRate: 32,
  },
  {
    videoSrc: "/video-production/trendy.mp4",
    videoLabel: "Trendy Edits",
    views: 1089,
    uniqueViewers: 814,
    avgWatchPercent: 71,
    completionRate: 47,
  },
  {
    videoSrc: "/video-production/realtor.mp4",
    videoLabel: "Realtor Videos",
    views: 612,
    uniqueViewers: 498,
    avgWatchPercent: 49,
    completionRate: 28,
  },
  {
    videoSrc: "/video-production/branding.mp4",
    videoLabel: "Branding Videos",
    views: 738,
    uniqueViewers: 581,
    avgWatchPercent: 54,
    completionRate: 31,
  },
  {
    videoSrc: "/vfx/architectural-1.mp4",
    videoLabel: "Architectural visualization",
    views: 446,
    uniqueViewers: 372,
    avgWatchPercent: 44,
    completionRate: 21,
  },
  {
    videoSrc: "/vfx/architectural-2.mp4",
    videoLabel: "Product CGI",
    views: 287,
    uniqueViewers: 241,
    avgWatchPercent: 41,
    completionRate: 19,
  },
];

const TOP_CTAS: CtaMetrics[] = [
  { label: "Social: @avariscorporation", location: "final-cta", count: 412, uniqueClicks: 327 },
  { label: "Email: hello@avarisco.net", location: "final-cta", count: 268, uniqueClicks: 224 },
  { label: "Website: avarisco.net", location: "final-cta", count: 134, uniqueClicks: 112 },
  { label: "Sound", location: "vfx-3d", count: 89, uniqueClicks: 76 },
  { label: "Sound", location: "video-production", count: 71, uniqueClicks: 58 },
];

const SCROLL_DEPTH: ScrollDepthDistribution[] = [
  { sectionId: "where-we-started", label: "Where We Started", reachedPct: 92 },
  { sectionId: "the-proof", label: "The Proof", reachedPct: 84 },
  { sectionId: "deserves-better", label: "Middle East Deserves Better", reachedPct: 76 },
  { sectionId: "services-overview", label: "Services Overview", reachedPct: 68 },
  { sectionId: "video-production", label: "Video Production", reachedPct: 61 },
  { sectionId: "vfx-3d", label: "VFX & 3D", reachedPct: 52 },
  { sectionId: "photoshoot", label: "Photoshoot", reachedPct: 47 },
  { sectionId: "our-process", label: "Our Process", reachedPct: 41 },
  { sectionId: "organic-reach", label: "Organic Reach", reachedPct: 36 },
  { sectionId: "testimonials", label: "Testimonials", reachedPct: 33 },
  { sectionId: "final-cta", label: "Final CTA", reachedPct: 31 },
];

const TRAFFIC_SOURCES: TrafficSource[] = [
  { source: "Direct", visits: 1890, percentage: 35 },
  { source: "Google", visits: 1620, percentage: 30 },
  { source: "Instagram", visits: 1080, percentage: 20 },
  { source: "LinkedIn", visits: 540, percentage: 10 },
  { source: "Other", visits: 270, percentage: 5 },
];

const DEVICES: DeviceBreakdown[] = [
  { device: "mobile", visits: 3510, percentage: 65 },
  { device: "desktop", visits: 1620, percentage: 30 },
  { device: "tablet", visits: 270, percentage: 5 },
];

const TOP_REFERRERS: TopReferrer[] = [
  { domain: "instagram.com", count: 624 },
  { domain: "linkedin.com", count: 318 },
  { domain: "youtube.com", count: 187 },
  { domain: "t.co", count: 142 },
  { domain: "reddit.com", count: 96 },
];

const RECENT_EVENTS: RecentEvent[] = [
  { id: "e_001", createdAt: minutesAgo(2),  eventType: "video_play",     path: "/", summary: "Played Cinematic Edits" },
  { id: "e_002", createdAt: minutesAgo(4),  eventType: "scroll_depth",   path: "/", summary: "Reached 75% of the page" },
  { id: "e_003", createdAt: minutesAgo(7),  eventType: "cta_click",      path: "/", summary: "Clicked Email: hello@avarisco.net" },
  { id: "e_004", createdAt: minutesAgo(11), eventType: "page_view",      path: "/", summary: "Landed on /" },
  { id: "e_005", createdAt: minutesAgo(15), eventType: "video_progress", path: "/", summary: "Watched 50% of Lifestyle Edits" },
  { id: "e_006", createdAt: minutesAgo(22), eventType: "external_link",  path: "/", summary: "Left to instagram.com" },
  { id: "e_007", createdAt: minutesAgo(28), eventType: "video_play",     path: "/", summary: "Played Trendy Edits" },
  { id: "e_008", createdAt: minutesAgo(34), eventType: "scroll_depth",   path: "/", summary: "Reached 50% of the page" },
  { id: "e_009", createdAt: minutesAgo(41), eventType: "page_view",      path: "/", summary: "Landed on /" },
  { id: "e_010", createdAt: minutesAgo(56), eventType: "cta_click",      path: "/", summary: "Clicked Social: @avariscorporation" },
];

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

const TOP_VIDEO_BY_VIEWS = [...VIDEO_METRICS].sort((a, b) => b.views - a.views)[0];

export const mockAnalytics: AnalyticsSnapshot = {
  totalVisitorsLast30d: PAGE_VIEWS_TREND.reduce((s, p) => s + p.count, 0),
  topVideo: TOP_VIDEO_BY_VIEWS
    ? { label: TOP_VIDEO_BY_VIEWS.videoLabel, views: TOP_VIDEO_BY_VIEWS.views }
    : null,
  pageViewsTrend: PAGE_VIEWS_TREND,
  videoMetrics: VIDEO_METRICS,
  topCtas: TOP_CTAS,
  scrollDepth: SCROLL_DEPTH,
  trafficSources: TRAFFIC_SOURCES,
  devices: DEVICES,
  topReferrers: TOP_REFERRERS,
  recentEvents: RECENT_EVENTS,
};

// Phase 3: clients + projects mocks moved to services/admin/clients.mock.ts
// + services/admin/projects.mock.ts so they hang off the proper service
// interfaces (filtering, pagination, etc.).
