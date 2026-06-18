import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleClient } from "@/lib/supabase";
import type {
  AnalyticsSnapshot,
  CtaMetrics,
  DeviceBreakdown,
  RecentEvent,
  RecentEventType,
  ScrollDepthDistribution,
  TopReferrer,
  TrafficSource,
  TrendPoint,
  VideoMetrics,
} from "@/types/admin";
import type { AnalyticsService } from "./analytics";

/**
 * Supabase-backed analytics. Aggregates `public.events` rows in-memory.
 *
 * Cost shape: each `getSnapshot()` runs ~5 queries against the events
 * table (last 30 days). Most queries do `select(...)` not `count` —
 * we then reduce client-side. For the AVARIS volume that's fine; if
 * the events table grows past a few hundred thousand rows we should
 * push aggregates into a Postgres view or RPC.
 *
 * Time window: hardcoded last 30 days. Change here if you want longer.
 */
const WINDOW_DAYS = 30;

export function createSupabaseAnalyticsService(): AnalyticsService {
  return {
    async getSnapshot(): Promise<AnalyticsSnapshot> {
      const supabase = getServiceRoleClient();
      const since = daysAgoISO(WINDOW_DAYS);

      // Pull all events in one fetch — usually < 50K rows for a small
      // site. Bail early if empty so all downstream code can assume
      // arrays are non-empty.
      //
      // The await is wrapped because supabase-js THROWS (not returns an
      // error object) when the underlying fetch can't reach Supabase at
      // all ("TypeError: fetch failed" — project paused, wrong URL, no
      // network). A dead Supabase shouldn't take down the whole admin
      // dashboard, so we degrade to an empty snapshot.
      let result: Awaited<ReturnType<typeof runQuery>>;
      try {
        result = await runQuery(supabase, since);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[analytics] events fetch failed (${msg}) — returning empty snapshot.`,
        );
        return emptySnapshot();
      }

      const { data, error } = result;

      if (error) {
        // Table missing → return an empty snapshot. Two scenarios where
        // this is right behavior:
        //   - 0001_admin_dashboard.sql migration not applied yet
        //   - Tracking has never been enabled in production
        // PGRST205 = "table not found in schema cache",
        // 42P01 = Postgres "relation does not exist".
        const code = (error as { code?: string }).code;
        const message = error.message ?? "";
        const missingTable =
          code === "PGRST205" ||
          code === "42P01" ||
          /could not find the table/i.test(message) ||
          /does not exist/i.test(message);
        // Connectivity failure surfaced as a returned error rather than a
        // throw — same graceful degradation.
        const connectionFailed =
          /fetch failed/i.test(message) ||
          /network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(message);
        if (missingTable || connectionFailed) {
          console.warn(
            `[analytics] events unavailable (${message || code}) — ` +
              "returning empty snapshot.",
          );
          return emptySnapshot();
        }
        throw new Error(`analytics.getSnapshot: ${message}`);
      }

      const events = (data ?? []) as EventRow[];

      const pageViews = events.filter((e) => e.event_type === "page_view");
      const videoPlays = events.filter((e) => e.event_type === "video_play");
      const videoProgresses = events.filter(
        (e) => e.event_type === "video_progress",
      );
      const ctaClicks = events.filter((e) => e.event_type === "cta_click");
      const scrollEvents = events.filter(
        (e) => e.event_type === "scroll_depth",
      );

      const uniqueSessions = new Set(events.map((e) => e.session_id));

      const pageViewsTrend = buildPageViewsTrend(pageViews, WINDOW_DAYS);
      const videoMetrics = buildVideoMetrics(videoPlays, videoProgresses);
      const topVideo = videoMetrics[0]
        ? { label: videoMetrics[0].videoLabel, views: videoMetrics[0].views }
        : null;

      return {
        totalVisitorsLast30d: uniqueSessions.size,
        topVideo,
        pageViewsTrend,
        videoMetrics: videoMetrics.slice(0, 10),
        topCtas: buildTopCtas(ctaClicks).slice(0, 5),
        scrollDepth: buildScrollDepth(scrollEvents),
        trafficSources: buildTrafficSources(pageViews),
        devices: buildDevices(events),
        topReferrers: buildTopReferrers(events).slice(0, 5),
        recentEvents: buildRecentEvents(events).slice(0, 10),
      };
    },
  };
}

// ── row shape ─────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  created_at: string;
  session_id: string;
  event_type: RecentEventType;
  event_data: Record<string, unknown>;
  referrer: string | null;
  user_agent: string | null;
  viewport_width: number | null;
  path: string;
}

// ── empty fallback ────────────────────────────────────────────────────

function emptySnapshot(): AnalyticsSnapshot {
  return {
    totalVisitorsLast30d: 0,
    topVideo: null,
    pageViewsTrend: buildPageViewsTrend([], WINDOW_DAYS),
    videoMetrics: [],
    topCtas: [],
    scrollDepth: [],
    trafficSources: [],
    devices: [],
    topReferrers: [],
    recentEvents: [],
  };
}

// ── builders ──────────────────────────────────────────────────────────

function buildPageViewsTrend(events: EventRow[], days: number): TrendPoint[] {
  const buckets: Record<string, number> = {};
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    if (day in buckets) buckets[day]++;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

function buildVideoMetrics(
  plays: EventRow[],
  progresses: EventRow[],
): VideoMetrics[] {
  // Aggregate plays by videoSrc.
  type Bucket = {
    videoSrc: string;
    videoLabel: string;
    views: number;
    sessions: Set<string>;
    progressSum: number;
    progressCount: number;
    completes: number;
  };
  const m = new Map<string, Bucket>();
  const ensure = (
    src: string,
    label: string | undefined,
    sessionId: string,
  ) => {
    let b = m.get(src);
    if (!b) {
      b = {
        videoSrc: src,
        videoLabel: label ?? src,
        views: 0,
        sessions: new Set<string>(),
        progressSum: 0,
        progressCount: 0,
        completes: 0,
      };
      m.set(src, b);
    } else if (label && b.videoLabel === b.videoSrc) {
      b.videoLabel = label;
    }
    b.sessions.add(sessionId);
    return b;
  };

  for (const e of plays) {
    const src = stringField(e.event_data, "videoSrc");
    if (!src) continue;
    const label = stringField(e.event_data, "videoLabel");
    const b = ensure(src, label, e.session_id);
    b.views++;
  }
  for (const e of progresses) {
    const src = stringField(e.event_data, "videoSrc");
    if (!src) continue;
    const label = stringField(e.event_data, "videoLabel");
    const b = ensure(src, label, e.session_id);
    const pct = numberField(e.event_data, "percent");
    if (pct !== null) {
      b.progressSum += pct;
      b.progressCount++;
      if (pct >= 90) b.completes++;
    }
  }

  return Array.from(m.values())
    .map<VideoMetrics>((b) => ({
      videoSrc: b.videoSrc,
      videoLabel: b.videoLabel,
      views: b.views,
      uniqueViewers: b.sessions.size,
      avgWatchPercent:
        b.progressCount > 0
          ? Math.round(b.progressSum / b.progressCount)
          : 0,
      completionRate:
        b.views > 0 ? Math.round((b.completes / b.views) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views);
}

function buildTopCtas(events: EventRow[]): CtaMetrics[] {
  type B = { label: string; location: string; count: number; sessions: Set<string> };
  const m = new Map<string, B>();
  for (const e of events) {
    const label = stringField(e.event_data, "label") ?? "(unlabeled)";
    const location = stringField(e.event_data, "location") ?? e.path;
    const key = `${label}|${location}`;
    const b = m.get(key) ?? {
      label,
      location,
      count: 0,
      sessions: new Set<string>(),
    };
    b.count++;
    b.sessions.add(e.session_id);
    m.set(key, b);
  }
  return Array.from(m.values())
    .map<CtaMetrics>((b) => ({
      label: b.label,
      location: b.location,
      count: b.count,
      uniqueClicks: b.sessions.size,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildScrollDepth(events: EventRow[]): ScrollDepthDistribution[] {
  type B = { sectionId: string; label: string; reached: Set<string>; total: Set<string> };
  const m = new Map<string, B>();
  // Count unique sessions that reached each section.
  for (const e of events) {
    const sectionId = stringField(e.event_data, "sectionId");
    if (!sectionId) continue;
    const label = stringField(e.event_data, "label") ?? sectionId;
    const b = m.get(sectionId) ?? {
      sectionId,
      label,
      reached: new Set<string>(),
      total: new Set<string>(),
    };
    b.reached.add(e.session_id);
    m.set(sectionId, b);
  }
  // Use total page-view sessions as the denominator.
  const totalSessions = new Set(events.map((e) => e.session_id)).size || 1;
  return Array.from(m.values()).map<ScrollDepthDistribution>((b) => ({
    sectionId: b.sectionId,
    label: b.label,
    reachedPct: Math.round((b.reached.size / totalSessions) * 100),
  }));
}

function buildTrafficSources(pageViews: EventRow[]): TrafficSource[] {
  const buckets: Record<string, number> = {};
  for (const e of pageViews) {
    const utm = stringField(e.event_data, "utm_source");
    if (utm) {
      buckets[utm] = (buckets[utm] ?? 0) + 1;
      continue;
    }
    if (!e.referrer || e.referrer === "") {
      buckets["Direct"] = (buckets["Direct"] ?? 0) + 1;
      continue;
    }
    const host = safeHost(e.referrer);
    const label = sourceLabel(host);
    buckets[label] = (buckets[label] ?? 0) + 1;
  }
  const total = Object.values(buckets).reduce((s, n) => s + n, 0) || 1;
  return Object.entries(buckets)
    .map<TrafficSource>(([source, visits]) => ({
      source,
      visits,
      percentage: Math.round((visits / total) * 100),
    }))
    .sort((a, b) => b.visits - a.visits);
}

function buildDevices(events: EventRow[]): DeviceBreakdown[] {
  type Bucket = { mobile: Set<string>; desktop: Set<string>; tablet: Set<string> };
  const buckets: Bucket = {
    mobile: new Set(),
    desktop: new Set(),
    tablet: new Set(),
  };
  for (const e of events) {
    const w = e.viewport_width ?? 0;
    if (w === 0) continue;
    if (w < 640) buckets.mobile.add(e.session_id);
    else if (w < 1024) buckets.tablet.add(e.session_id);
    else buckets.desktop.add(e.session_id);
  }
  const total =
    buckets.mobile.size + buckets.desktop.size + buckets.tablet.size || 1;
  const out: DeviceBreakdown[] = (
    [
      { device: "mobile", visits: buckets.mobile.size },
      { device: "desktop", visits: buckets.desktop.size },
      { device: "tablet", visits: buckets.tablet.size },
    ] as const
  ).map((d) => ({
    device: d.device,
    visits: d.visits,
    percentage: Math.round((d.visits / total) * 100),
  }));
  return out.sort((a, b) => b.visits - a.visits);
}

function buildTopReferrers(events: EventRow[]): TopReferrer[] {
  const m = new Map<string, number>();
  for (const e of events) {
    if (!e.referrer) continue;
    const host = safeHost(e.referrer);
    if (!host || host === "self") continue;
    m.set(host, (m.get(host) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRecentEvents(events: EventRow[]): RecentEvent[] {
  return events.slice(0, 50).map<RecentEvent>((e) => ({
    id: e.id,
    createdAt: e.created_at,
    eventType: e.event_type,
    path: e.path,
    summary: summarize(e),
  }));
}

// ── helpers ───────────────────────────────────────────────────────────

function summarize(e: EventRow): string {
  const data = e.event_data;
  switch (e.event_type) {
    case "page_view":
      return `Landed on ${e.path}`;
    case "video_play":
      return `Played ${stringField(data, "videoLabel") ?? "video"}`;
    case "video_progress": {
      const pct = numberField(data, "percent");
      return `Watched ${pct ?? "?"}% of ${stringField(data, "videoLabel") ?? "video"}`;
    }
    case "cta_click":
      return `Clicked ${stringField(data, "label") ?? "CTA"}`;
    case "scroll_depth":
      return `Reached ${stringField(data, "label") ?? "section"}`;
    case "external_link":
      return `Left to ${stringField(data, "host") ?? "external link"}`;
    default:
      return e.event_type;
  }
}

function stringField(o: Record<string, unknown>, k: string): string | undefined {
  const v = o[k];
  return typeof v === "string" ? v : undefined;
}
function numberField(
  o: Record<string, unknown>,
  k: string,
): number | null {
  const v = o[k];
  return typeof v === "number" ? v : null;
}

function safeHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourceLabel(host: string): string {
  if (!host) return "Direct";
  if (/google\./.test(host)) return "Google";
  if (/instagram\./.test(host)) return "Instagram";
  if (/linkedin\./.test(host)) return "LinkedIn";
  if (/twitter\.|x\.com$/.test(host)) return "Twitter/X";
  if (/facebook\./.test(host)) return "Facebook";
  if (/youtube\./.test(host)) return "YouTube";
  if (/reddit\./.test(host)) return "Reddit";
  if (/t\.co$/.test(host)) return "Twitter/X";
  return host;
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** The events query, extracted so its result type can be reused above. */
function runQuery(supabase: SupabaseClient, since: string) {
  return supabase
    .from("events")
    .select(
      "id,created_at,session_id,event_type,event_data,referrer,user_agent,viewport_width,path",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false });
}
