import { getServiceRoleClient, isSupabaseUnavailable } from "@/lib/supabase";
import {
  ACTIVE_PROJECT_STATUS_OR_CLAUSE,
  type ProjectClass,
  type ProjectVideoType,
} from "@/types/projects";
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
 * Reports backed by Supabase. Aggregations run in-memory because the
 * dataset is small (~3,400 projects + ~310 clients fits comfortably).
 *
 * Time windows:
 *   - "month" / "year" → filter projects on `timeline_start`. NULL
 *     timeline_start excludes the project from time-based aggregates.
 *     Why timeline_start: it's when the actual work happened, not when
 *     we synced it from Monday — that gives accurate historical reports.
 *   - "all" → no filter.
 *
 * For "new clients per month" we filter on `created_at` (Supabase row
 * creation). Caveat: after the initial sync, all 310 clients show up in
 * the month of that sync. The chart becomes useful for clients added
 * AFTER the initial sync.
 */
export function createSupabaseReportsService(): ReportsService {
  return {
    async getOverview(): Promise<ReportsOverview> {
      const supabase = getServiceRoleClient();
      const monthStart = startOfMonth().toISOString();

      try {
        const [
          activeClientsRes,
          activeProjectsRes,
          newClientsRes,
          monthRevRes,
        ] = await Promise.all([
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .neq("status", "inactive"),
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .or(ACTIVE_PROJECT_STATUS_OR_CLAUSE),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .gte("created_at", monthStart),
          supabase
            .from("projects")
            .select("paypal_income_cents")
            .gte("timeline_start", monthStart.slice(0, 10))
            .not("timeline_start", "is", null),
        ]);

        const totalRevenueCentsThisMonth = (monthRevRes.data ?? []).reduce(
          (s: number, r: { paypal_income_cents: number | null }) =>
            s + (r.paypal_income_cents ?? 0),
          0,
        );

        const topThisMonth = await topClientsByProjectCount(
          supabase,
          "month",
          5,
        );

        return {
          totalActiveClients: activeClientsRes.count ?? 0,
          totalActiveProjects: activeProjectsRes.count ?? 0,
          newClientsThisMonth: newClientsRes.count ?? 0,
          totalRevenueCentsThisMonth,
          topClientsThisMonth: topThisMonth,
        };
      } catch (err) {
        // A dead Supabase shouldn't crash the overview page — degrade to
        // zeros (the page still renders; a warning lands in the logs).
        if (isSupabaseUnavailable(err)) {
          console.warn(
            `[reports] overview unavailable (${
              err instanceof Error ? err.message : String(err)
            }) — returning zeros.`,
          );
          return {
            totalActiveClients: 0,
            totalActiveProjects: 0,
            newClientsThisMonth: 0,
            totalRevenueCentsThisMonth: 0,
            topClientsThisMonth: [],
          };
        }
        throw err;
      }
    },

    async getTopClientsByProjectCount(period, limit) {
      return topClientsByProjectCount(getServiceRoleClient(), period, limit);
    },

    async getTopClientsByRevenue(period, limit) {
      return topClientsByRevenue(getServiceRoleClient(), period, limit);
    },

    async getNewClientsByMonth(months: number): Promise<MonthlyCount[]> {
      const supabase = getServiceRoleClient();
      const cutoff = monthsAgoStart(months).toISOString();
      const stamps: string[] = [];

      for (let start = 0; start < FETCH_SAFETY_CAP; start += FETCH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from("clients")
          .select("created_at")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: true })
          .range(start, start + FETCH_PAGE_SIZE - 1);
        if (error) throw new Error(`reports.newClients: ${error.message}`);
        const rows = (data ?? []) as { created_at: string }[];
        for (const r of rows) stamps.push(r.created_at);
        if (rows.length < FETCH_PAGE_SIZE) break;
      }
      return groupByMonth(stamps, months);
    },

    async getCountByVideoType(
      period: ReportPeriod,
    ): Promise<VideoTypeBreakdown[]> {
      const rows = await fetchProjectAgg("video_type", period);
      const m = new Map<ProjectVideoType, { count: number; revenue: number }>();
      for (const r of rows) {
        if (!r.video_type) continue;
        const cur = m.get(r.video_type) ?? { count: 0, revenue: 0 };
        cur.count++;
        cur.revenue += r.paypal_income_cents ?? 0;
        m.set(r.video_type, cur);
      }
      return Array.from(m.entries())
        .map(([videoType, v]) => ({
          videoType,
          count: v.count,
          revenueCents: v.revenue,
        }))
        .sort((a, b) => b.count - a.count);
    },

    async getCountByClass(period: ReportPeriod): Promise<ClassBreakdown[]> {
      const rows = await fetchProjectAgg("class", period);
      const m = new Map<ProjectClass, { count: number; revenue: number }>();
      for (const r of rows) {
        if (!r.class) continue;
        const cur = m.get(r.class) ?? { count: 0, revenue: 0 };
        cur.count++;
        cur.revenue += r.paypal_income_cents ?? 0;
        m.set(r.class, cur);
      }
      return Array.from(m.entries())
        .map(([cls, v]) => ({
          class: cls,
          count: v.count,
          revenueCents: v.revenue,
        }))
        .sort((a, b) => a.class.localeCompare(b.class));
    },

    async getPopularCombinations(
      period: ReportPeriod,
      limit: number,
    ): Promise<PopularCombination[]> {
      const rows = await fetchProjectAgg("combo", period);
      const key = (c: ProjectClass, v: ProjectVideoType) => `${c}|${v}`;
      const m = new Map<string, { class: ProjectClass; videoType: ProjectVideoType; count: number }>();
      for (const r of rows) {
        if (!r.class || !r.video_type) continue;
        const k = key(r.class, r.video_type);
        const cur = m.get(k) ?? { class: r.class, videoType: r.video_type, count: 0 };
        cur.count++;
        m.set(k, cur);
      }
      return Array.from(m.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },

    async getRevenueTrend(months: number): Promise<MonthlyRevenue[]> {
      const supabase = getServiceRoleClient();
      const cutoff = monthsAgoStart(months).toISOString().slice(0, 10);
      const buckets = emptyMonthBuckets(months);

      for (let start = 0; start < FETCH_SAFETY_CAP; start += FETCH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from("projects")
          .select("timeline_start,paypal_income_cents")
          .gte("timeline_start", cutoff)
          .not("timeline_start", "is", null)
          .order("timeline_start", { ascending: true })
          .range(start, start + FETCH_PAGE_SIZE - 1);
        if (error) throw new Error(`reports.revenueTrend: ${error.message}`);
        const rows = (data ?? []) as {
          timeline_start: string | null;
          paypal_income_cents: number | null;
        }[];
        for (const r of rows) {
          if (!r.timeline_start) continue;
          const month = r.timeline_start.slice(0, 7);
          const idx = buckets.findIndex((b) => b.month === month);
          if (idx >= 0) buckets[idx].revenueCents += r.paypal_income_cents ?? 0;
        }
        if (rows.length < FETCH_PAGE_SIZE) break;
      }
      return buckets;
    },

    async getRevenueByVideoType(
      period: ReportPeriod,
    ): Promise<RevenueBreakdown[]> {
      const breakdown = await this.getCountByVideoType(period);
      const total = breakdown.reduce((s, b) => s + b.revenueCents, 0);
      return breakdown.map((b) => ({
        bucket: b.videoType,
        revenueCents: b.revenueCents,
        percentage: total > 0 ? (b.revenueCents / total) * 100 : 0,
      }));
    },

    async getRevenueByClass(period: ReportPeriod): Promise<RevenueBreakdown[]> {
      const breakdown = await this.getCountByClass(period);
      const total = breakdown.reduce((s, b) => s + b.revenueCents, 0);
      return breakdown.map((b) => ({
        bucket: b.class,
        revenueCents: b.revenueCents,
        percentage: total > 0 ? (b.revenueCents / total) * 100 : 0,
      }));
    },

    async getStatusDistribution(): Promise<StatusDistribution[]> {
      // Aggregate in Postgres — a raw `.select("status")` is capped at
      // 1000 rows by Supabase's default `db-max-rows`, which would
      // silently truncate the breakdown. The RPC returns one row per
      // distinct status (added in migration 0004).
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase.rpc(
        "project_status_distribution",
      );
      if (error) throw new Error(`reports.statusDist: ${error.message}`);
      const rows = (data ?? []) as Array<{
        status: string;
        count: number | string;
      }>;
      // Postgres bigint comes back as either number or string depending
      // on supabase-js version — coerce defensively.
      const normalized = rows.map((r) => ({
        status: r.status,
        count: typeof r.count === "number" ? r.count : Number(r.count),
      }));
      const total = normalized.reduce((s, r) => s + r.count, 0);
      return normalized
        .map((r) => ({
          status: r.status,
          count: r.count,
          percentage: total > 0 ? (r.count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
  };
}

// ── helpers ───────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof getServiceRoleClient>;

interface ProjectAggRow {
  class: ProjectClass | null;
  video_type: ProjectVideoType | null;
  paypal_income_cents: number | null;
  client_id: string | null;
  client_name_text: string | null;
  clients?: { id: string; name: string } | null;
  timeline_start: string | null;
}

// ── Pagination ────────────────────────────────────────────────────────
// Supabase's default db-max-rows = 1000 silently truncates `.select()`
// results. Anywhere we need ALL rows for in-memory aggregation we have
// to paginate; the helper below reassembles the full set in 1k chunks.
//
// Safety cap (50k) protects against runaway loops if a query is wider
// than expected. For projects (~3,400) + clients (~310) this never bites.

const FETCH_PAGE_SIZE = 1000;
const FETCH_SAFETY_CAP = 50_000;

async function fetchProjectAgg(
  _which: "class" | "video_type" | "combo",
  period: ReportPeriod,
): Promise<ProjectAggRow[]> {
  const supabase = getServiceRoleClient();
  const out: ProjectAggRow[] = [];

  for (let start = 0; start < FETCH_SAFETY_CAP; start += FETCH_PAGE_SIZE) {
    let query = supabase
      .from("projects")
      .select(
        "class,video_type,paypal_income_cents,client_id,client_name_text,timeline_start,clients(id,name)",
      )
      .range(start, start + FETCH_PAGE_SIZE - 1);
    if (period !== "all") {
      const cutoff = (period === "month" ? startOfMonth() : startOfYear())
        .toISOString()
        .slice(0, 10);
      query = query
        .gte("timeline_start", cutoff)
        .not("timeline_start", "is", null);
    }
    const { data, error } = await query;
    if (error) throw new Error(`reports.fetchProjectAgg: ${error.message}`);
    const rows = (data ?? []) as unknown as ProjectAggRow[];
    out.push(...rows);
    if (rows.length < FETCH_PAGE_SIZE) break;
  }
  return out;
}

async function topClientsByProjectCount(
  _supabase: SupabaseClient,
  period: ReportPeriod,
  limit: number,
): Promise<TopClient[]> {
  const rows = await fetchProjectAgg("class", period);
  const m = new Map<string, TopClient>();
  for (const r of rows) {
    if (!r.client_id) continue;
    const name = r.clients?.name ?? r.client_name_text ?? "Unknown";
    const cur =
      m.get(r.client_id) ??
      ({
        clientId: r.client_id,
        name,
        projectCount: 0,
        totalRevenueCents: 0,
        avgProjectValueCents: 0,
      } satisfies TopClient);
    cur.projectCount++;
    cur.totalRevenueCents += r.paypal_income_cents ?? 0;
    m.set(r.client_id, cur);
  }
  return Array.from(m.values())
    .map((c) => ({
      ...c,
      avgProjectValueCents:
        c.projectCount > 0 ? Math.round(c.totalRevenueCents / c.projectCount) : 0,
    }))
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, limit);
}

async function topClientsByRevenue(
  _supabase: SupabaseClient,
  period: ReportPeriod,
  limit: number,
): Promise<TopClient[]> {
  const all = await topClientsByProjectCount(_supabase, period, 9999);
  return all
    .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
    .slice(0, limit);
}

function startOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function startOfYear(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}
function monthsAgoStart(months: number, d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (months - 1), 1));
}
function emptyMonthBuckets(months: number): MonthlyRevenue[] {
  const out: MonthlyRevenue[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      revenueCents: 0,
    });
  }
  return out;
}
function groupByMonth(timestamps: string[], months: number): MonthlyCount[] {
  const buckets = emptyMonthBuckets(months).map((b) => ({
    month: b.month,
    count: 0,
  }));
  for (const ts of timestamps) {
    const month = ts.slice(0, 7);
    const b = buckets.find((x) => x.month === month);
    if (b) b.count++;
  }
  return buckets;
}
