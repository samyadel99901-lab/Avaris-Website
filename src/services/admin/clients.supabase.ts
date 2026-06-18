import { getServiceRoleClient } from "@/lib/supabase";
import type {
  Client,
  ClientFilters,
  ClientListResult,
  ClientPricing,
  ClientStats,
  ClientStatus,
} from "@/types/clients";
import type { ClientsService } from "./clients";

/**
 * Supabase-backed implementation of `ClientsService`.
 * Reads from `public.clients` via the service-role key (RLS bypassed).
 */
export function createSupabaseClientsService(): ClientsService {
  return {
    async list(filters: ClientFilters = {}): Promise<ClientListResult> {
      const supabase = getServiceRoleClient();
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .range(from, to);

      // Filters
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.country) query = query.eq("country", filters.country);
      if (filters.hasSpecialDeal !== undefined) {
        query = query.eq("is_special_deal", filters.hasSpecialDeal);
      }
      if (filters.needsFollowup !== undefined) {
        query = query.eq("needs_followup", filters.needsFollowup);
      }
      // Search — Postgres ilike across name/email/code. Trigram index
      // accelerates the like-pattern variant.
      if (filters.search?.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(
          `name.ilike.${term},email.ilike.${term},code.ilike.${term}`,
        );
      }

      // Sort
      const sortBy = filters.sortBy ?? "last_project_at";
      const sortDir = filters.sortDir ?? "desc";
      query = query.order(sortBy, {
        ascending: sortDir === "asc",
        nullsFirst: false,
      });

      const { data, count, error } = await query;
      if (error) throw new Error(`clients.list failed: ${error.message}`);

      return {
        items: (data ?? []).map(rowToClient),
        total: count ?? 0,
        page,
        pageSize,
      };
    },

    async getById(id: string): Promise<Client | null> {
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(`clients.getById failed: ${error.message}`);
      return data ? rowToClient(data) : null;
    },

    async getStats(): Promise<ClientStats> {
      const supabase = getServiceRoleClient();
      const monthStart = startOfMonthISO();

      // Run all counts in parallel.
      const [activeRes, newRes, followupRes, reconnectingRes] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .neq("status", "inactive"),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .gte("created_at", monthStart),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("needs_followup", true),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("is_reconnecting", true),
        ]);

      return {
        totalActive: activeRes.count ?? 0,
        newThisMonth: newRes.count ?? 0,
        needFollowup: followupRes.count ?? 0,
        reconnecting: reconnectingRes.count ?? 0,
      };
    },

    async listCountries(): Promise<string[]> {
      const supabase = getServiceRoleClient();
      const { data, error } = await supabase
        .from("clients")
        .select("country")
        .not("country", "is", null);
      if (error) throw new Error(`clients.listCountries: ${error.message}`);
      const set = new Set<string>();
      for (const row of data ?? []) {
        if (typeof row.country === "string" && row.country.trim()) {
          set.add(row.country.trim());
        }
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    },
  };
}

// ── row → domain ──────────────────────────────────────────────────────

interface ClientRow {
  id: string;
  monday_item_id: number;
  name: string;
  email: string | null;
  code: string | null;
  country: string | null;
  team_leader: string | null;
  platform: string | null;
  eta: string | null;
  payment_schedule: string | null;
  price_a_less_1min_cents: number | null;
  price_a_more_1min_cents: number | null;
  price_b_less_1min_cents: number | null;
  price_b_more_1min_cents: number | null;
  special_a_video_cents: number | null;
  special_a_reel_cents: number | null;
  special_b_video_cents: number | null;
  special_b_reel_cents: number | null;
  price_class_c: string | null;
  is_special_deal: boolean;
  needs_followup: boolean;
  is_reconnecting: boolean;
  last_project_at: string | null;
  status: ClientStatus;
  monday_updated_at: string | null;
  synced_at: string;
  created_at: string;
}

function rowToClient(row: ClientRow): Client {
  const pricing: ClientPricing = {
    aLess1MinCents: row.price_a_less_1min_cents,
    aMore1MinCents: row.price_a_more_1min_cents,
    bLess1MinCents: row.price_b_less_1min_cents,
    bMore1MinCents: row.price_b_more_1min_cents,
    specialAVideoCents: row.special_a_video_cents,
    specialAReelCents: row.special_a_reel_cents,
    specialBVideoCents: row.special_b_video_cents,
    specialBReelCents: row.special_b_reel_cents,
    classCText: row.price_class_c,
    isSpecialDeal: row.is_special_deal,
  };
  return {
    id: row.id,
    mondayItemId: row.monday_item_id,
    name: row.name,
    email: row.email,
    code: row.code,
    country: row.country,
    teamLeader: row.team_leader,
    platform: row.platform,
    eta: row.eta,
    paymentSchedule: row.payment_schedule,
    pricing,
    needsFollowup: row.needs_followup,
    isReconnecting: row.is_reconnecting,
    status: row.status,
    lastProjectAt: row.last_project_at,
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
