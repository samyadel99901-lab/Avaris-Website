import type {
  Client,
  ClientFilters,
  ClientListResult,
  ClientStats,
} from "@/types/clients";

/**
 * Read API for clients. Backed by Supabase in production; mocked for
 * local dev when ADMIN_DATA_SOURCE=mock.
 *
 * No write methods — clients live in Monday and are pushed in via the
 * Phase 3 sync. The dashboard is read-only on this domain.
 */
export interface ClientsService {
  list(filters?: ClientFilters): Promise<ClientListResult>;
  getById(id: string): Promise<Client | null>;
  getStats(): Promise<ClientStats>;
  /** Distinct country values, sorted, for the filter dropdown. */
  listCountries(): Promise<string[]>;
}
