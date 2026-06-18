import { getServiceRoleClient } from "@/lib/supabase";
import {
  ACTIVE_PROJECT_STATUS_OR_CLAUSE,
  type Project,
  type ProjectClass,
  type ProjectFilters,
  type ProjectFinancials,
  type ProjectListResult,
  type ProjectStats,
  type ProjectVideoType,
} from "@/types/projects";
import type { ProjectsService } from "./projects";

/**
 * Supabase-backed implementation. Joins on `clients` for the display
 * name in list views; falls back to the Monday text when the FK isn't
 * resolved.
 */
export function createSupabaseProjectsService(): ProjectsService {
  return {
    async list(filters: ProjectFilters = {}): Promise<ProjectListResult> {
      const supabase = getServiceRoleClient();
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("projects")
        .select("*, clients(id, name)", { count: "exact" })
        .range(from, to);

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.class && filters.class !== "all") {
        query = query.eq("class", filters.class);
      }
      if (filters.videoType && filters.videoType !== "all") {
        query = query.eq("video_type", filters.videoType);
      }
      if (filters.invoiceStatus) {
        query = query.eq("invoice_status", filters.invoiceStatus);
      }
      if (filters.scammer === "scammer") query = query.eq("is_scammer", true);
      else if (filters.scammer === "valid") query = query.eq("is_scammer", false);
      if (filters.timelineFrom) {
        query = query.gte("timeline_start", filters.timelineFrom);
      }
      if (filters.timelineTo) {
        query = query.lte("timeline_start", filters.timelineTo);
      }
      if (filters.clientId) query = query.eq("client_id", filters.clientId);
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(
          `name.ilike.${term},code.ilike.${term},client_name_text.ilike.${term}`,
        );
      }

      const sortBy = filters.sortBy ?? "monday_updated_at";
      const sortColumn =
        sortBy === "paypal_income" ? "paypal_income_cents" : sortBy;
      const sortDir = filters.sortDir ?? "desc";
      query = query.order(sortColumn, {
        ascending: sortDir === "asc",
        nullsFirst: false,
      });

      const { data, count, error } = await query;
      if (error) throw new Error(`projects.list failed: ${error.message}`);

      return {
        items: (data ?? []).map(rowToProject),
        total: count ?? 0,
        page,
        pageSize,
      };
    },

    async getById(id: string): Promise<Project | null> {
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(id, name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`projects.getById failed: ${error.message}`);
      return data ? rowToProject(data) : null;
    },

    async getStats(): Promise<ProjectStats> {
      const supabase = getServiceRoleClient();
      const monthStart = startOfMonthISO();

      const [activeRes, doneRes, scammerRes, revRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .or(ACTIVE_PROJECT_STATUS_OR_CLAUSE),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .ilike("status", "Done"),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_scammer", true),
        supabase
          .from("projects")
          .select("paypal_income_cents")
          .gte("created_at", monthStart),
      ]);

      const totalRevenueCentsThisMonth = (revRes.data ?? []).reduce(
        (s: number, r: { paypal_income_cents: number | null }) =>
          s + (r.paypal_income_cents ?? 0),
        0,
      );

      return {
        totalActive: activeRes.count ?? 0,
        totalDone: doneRes.count ?? 0,
        scammerCount: scammerRes.count ?? 0,
        totalRevenueCentsThisMonth,
      };
    },

    async listStatuses(): Promise<string[]> {
      return distinctNonNull("status");
    },

    async listInvoiceStatuses(): Promise<string[]> {
      return distinctNonNull("invoice_status");
    },
  };
}

async function distinctNonNull(column: string): Promise<string[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("projects")
    .select(column)
    .not(column, "is", null);
  if (error) throw new Error(`projects.${column} distinct: ${error.message}`);
  const set = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<
    Record<string, string | null>
  >) {
    const v = row[column];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ── row → domain ──────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  monday_item_id: number;
  name: string;
  code: string | null;
  client_id: string | null;
  client_name_text: string | null;
  monday_client_item_id: number | null;
  class: ProjectClass | null;
  video_type: ProjectVideoType | null;
  video_type_raw: string | null;
  status: string | null;
  invoice_status: string | null;
  editor_pay_status: string | null;
  delivery_status: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  paypal_income_cents: number | null;
  deposit_cents: number;
  samy_paypal_cents: number;
  editor_cost_egp: number;
  bonus_egp: number;
  is_scammer: boolean;
  client_eta: string | null;
  footage_link: string | null;
  final_video_link: string | null;
  monday_updated_at: string | null;
  synced_at: string;
  created_at: string;
  // From joined clients(id, name)
  clients?: { id: string; name: string } | null;
}

function rowToProject(row: ProjectRow): Project {
  const financials: ProjectFinancials = {
    paypalIncomeCents: row.paypal_income_cents,
    depositCents: row.deposit_cents,
    samyPaypalCents: row.samy_paypal_cents,
    editorCostEgp: row.editor_cost_egp,
    bonusEgp: row.bonus_egp,
  };
  const resolvedName = row.clients?.name ?? row.client_name_text ?? null;
  return {
    id: row.id,
    mondayItemId: row.monday_item_id,
    name: row.name,
    code: row.code,
    clientId: row.client_id,
    clientName: resolvedName,
    mondayClientItemId: row.monday_client_item_id,
    class: row.class,
    videoType: row.video_type,
    videoTypeRaw: row.video_type_raw,
    status: row.status,
    invoiceStatus: row.invoice_status,
    editorPayStatus: row.editor_pay_status,
    deliveryStatus: row.delivery_status,
    timelineStart: row.timeline_start,
    timelineEnd: row.timeline_end,
    financials,
    isScammer: row.is_scammer,
    clientEta: row.client_eta,
    footageLink: row.footage_link,
    finalVideoLink: row.final_video_link,
    mondayUpdatedAt: row.monday_updated_at,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
  };
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0),
  ).toISOString();
}
