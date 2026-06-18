import type {
  Client,
  ClientFilters,
  ClientListResult,
  ClientStats,
} from "@/types/clients";
import type { ClientsService } from "./clients";

/**
 * Mock clients service for local dev when Supabase + Monday aren't
 * available. Deterministic — same data every page load.
 */
const NOW = new Date("2026-05-10T00:00:00Z").toISOString();

function dAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const MOCK_CLIENTS: Client[] = [
  mock(1, "Olivia Bennett", "olivia@bennettrealty.com", "United States", "active", true, 4),
  mock(2, "Marcus Chen", "marcus@chengroup.com", "Singapore", "active", false, 2),
  mock(3, "Sofia Reyes", "sofia@reyeshg.com", "Mexico", "important", true, 6),
  mock(4, "James Whitaker", "james.whitaker@gmail.com", "United Kingdom", "new", false, 1),
  mock(5, "Aisha Patel", "aisha@patelestates.com", "United Arab Emirates", "active", false, 3),
  mock(6, "Noah Williams", "noah@williamsco.com", "Canada", "active", true, 5),
  mock(7, "Zara Khan", null, "Pakistan", "quiet", false, 2),
  mock(8, "Ethan Park", "ethan.park@outlook.com", "South Korea", "to_review", false, 1),
  mock(9, "Amelia Cruz", "amelia@cruzstudios.com", "Spain", "active", true, 4),
  mock(10, "Daniel Brown", "daniel@brownrealty.com", "United States", "active", false, 3),
];

function mock(
  i: number,
  name: string,
  email: string | null,
  country: string,
  status: Client["status"],
  isSpecial: boolean,
  daysSinceProject: number,
): Client {
  return {
    id: `mock_${String(i).padStart(3, "0")}`,
    mondayItemId: 1000 + i,
    name,
    email,
    code: `AV${String(100 + i).padStart(3, "0")}`,
    country,
    teamLeader: i % 2 === 0 ? "Samy" : "Ahmed",
    platform: "Direct",
    eta: "3-5 business days",
    paymentSchedule: "Net 14",
    pricing: {
      aLess1MinCents: 7500,
      aMore1MinCents: 12500,
      bLess1MinCents: 5000,
      bMore1MinCents: 9000,
      specialAVideoCents: isSpecial ? 10000 : null,
      specialAReelCents: isSpecial ? 6500 : null,
      specialBVideoCents: null,
      specialBReelCents: null,
      classCText: null,
      isSpecialDeal: isSpecial,
    },
    needsFollowup: i === 4 || i === 8,
    isReconnecting: i === 7,
    status,
    lastProjectAt: dAgo(daysSinceProject * 7),
    mondayUpdatedAt: dAgo(2),
    syncedAt: NOW,
    createdAt: dAgo(60 + i * 30),
  };
}

export function createMockClientsService(): ClientsService {
  return {
    async list(filters: ClientFilters = {}): Promise<ClientListResult> {
      let items = [...MOCK_CLIENTS];

      if (filters.status && filters.status !== "all") {
        items = items.filter((c) => c.status === filters.status);
      }
      if (filters.country) items = items.filter((c) => c.country === filters.country);
      if (filters.hasSpecialDeal !== undefined) {
        items = items.filter(
          (c) => c.pricing.isSpecialDeal === filters.hasSpecialDeal,
        );
      }
      if (filters.needsFollowup !== undefined) {
        items = items.filter((c) => c.needsFollowup === filters.needsFollowup);
      }
      if (filters.search?.trim()) {
        const t = filters.search.trim().toLowerCase();
        items = items.filter(
          (c) =>
            c.name.toLowerCase().includes(t) ||
            c.email?.toLowerCase().includes(t) ||
            c.code?.toLowerCase().includes(t),
        );
      }

      const sortBy = filters.sortBy ?? "last_project_at";
      const sortDir = filters.sortDir ?? "desc";
      items.sort((a, b) => {
        const av = sortValue(a, sortBy);
        const bv = sortValue(b, sortBy);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });

      const total = items.length;
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        total,
        page,
        pageSize,
      };
    },

    async getById(id: string): Promise<Client | null> {
      return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
    },

    async getStats(): Promise<ClientStats> {
      return {
        totalActive: MOCK_CLIENTS.filter((c) => c.status !== "inactive").length,
        newThisMonth: 2,
        needFollowup: MOCK_CLIENTS.filter((c) => c.needsFollowup).length,
        reconnecting: MOCK_CLIENTS.filter((c) => c.isReconnecting).length,
      };
    },

    async listCountries(): Promise<string[]> {
      const set = new Set<string>();
      for (const c of MOCK_CLIENTS) {
        if (c.country) set.add(c.country);
      }
      return Array.from(set).sort();
    },
  };
}

function sortValue(c: Client, key: NonNullable<ClientFilters["sortBy"]>): string {
  switch (key) {
    case "name":
      return c.name.toLowerCase();
    case "last_project_at":
      return c.lastProjectAt ?? "";
    case "created_at":
      return c.createdAt;
  }
}
