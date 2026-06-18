/**
 * Client domain types — sourced from Monday "2025 Clients Data" board
 * (id 6589322272), normalized into Supabase + read by the admin dashboard.
 */

export type ClientStatus =
  | "new"
  | "to_review"
  | "important"
  | "active"
  | "quiet"
  | "not_found"
  | "upset"
  | "inactive";

/**
 * Pricing per client. Each rate is USD cents OR null when not configured.
 * `classCText` is free-form text on the board so we keep it as-is.
 */
export interface ClientPricing {
  aLess1MinCents: number | null;
  aMore1MinCents: number | null;
  bLess1MinCents: number | null;
  bMore1MinCents: number | null;
  specialAVideoCents: number | null;
  specialAReelCents: number | null;
  specialBVideoCents: number | null;
  specialBReelCents: number | null;
  classCText: string | null;
  isSpecialDeal: boolean;
}

export interface Client {
  id: string;
  mondayItemId: number;
  name: string;
  email: string | null;
  code: string | null;
  country: string | null;
  teamLeader: string | null;
  platform: string | null;
  eta: string | null;
  paymentSchedule: string | null;
  pricing: ClientPricing;
  needsFollowup: boolean;
  isReconnecting: boolean;
  status: ClientStatus;
  /** ISO 8601 — most recent project for this client (from Monday). */
  lastProjectAt: string | null;
  mondayUpdatedAt: string | null;
  syncedAt: string;
  createdAt: string;
}

export interface ClientFilters {
  /** Trigram match across name + email + code. */
  search?: string;
  status?: ClientStatus | "all";
  country?: string;
  hasSpecialDeal?: boolean;
  needsFollowup?: boolean;
  sortBy?: "name" | "last_project_at" | "created_at";
  sortDir?: "asc" | "desc";
  /** 1-based. */
  page?: number;
  /** Default 50. */
  pageSize?: number;
}

export interface ClientListResult {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientStats {
  totalActive: number;
  newThisMonth: number;
  needFollowup: number;
  reconnecting: number;
}
