/**
 * Project domain types — sourced from Monday "Customer Projects" board
 * (id 6589241558), normalized into Supabase + read by the admin dashboard.
 */

export type ProjectClass = "A" | "B" | "C";

/**
 * Categorical video type derived from the Monday "Video Type" dropdown.
 * Anything we don't recognize falls into "other"; the original label is
 * preserved in `videoTypeRaw` for debugging / future mapping.
 */
export type ProjectVideoType =
  | "reel_short" // Reel (less than 1min)
  | "reel_long" // Reel (More than 1min)
  | "video_short" // Video (less than 1 min)
  | "video_long" // Video (more than 1min)
  | "photo" // Photo Editing
  | "other";

/**
 * Money on a project. PayPal-related figures are USD (in cents).
 * Editor cost + bonus are paid locally → EGP (whole units).
 *
 * `paypalIncomeCents` is nullable: null means "no PayPal data found
 * on Monday" (neither the new "PayPal Income" formula column nor the
 * legacy "Samy's PayPal" numbers column had a value). Aggregations
 * must skip null rather than treating them as $0.
 */
export interface ProjectFinancials {
  paypalIncomeCents: number | null;
  depositCents: number;
  samyPaypalCents: number;
  editorCostEgp: number;
  bonusEgp: number;
}

export interface Project {
  id: string;
  mondayItemId: number;
  name: string;
  code: string | null;

  /** Resolved Supabase FK; null until the matching client row exists. */
  clientId: string | null;
  /** Display name — either resolved from clients OR the Monday text fallback. */
  clientName: string | null;
  /** Raw Monday client id, kept so we can re-resolve clientId after a client sync. */
  mondayClientItemId: number | null;

  class: ProjectClass | null;
  videoType: ProjectVideoType | null;
  videoTypeRaw: string | null;

  status: string | null;
  invoiceStatus: string | null;
  editorPayStatus: string | null;
  deliveryStatus: string | null;

  /** YYYY-MM-DD or null. */
  timelineStart: string | null;
  timelineEnd: string | null;

  financials: ProjectFinancials;
  isScammer: boolean;

  clientEta: string | null;
  footageLink: string | null;
  finalVideoLink: string | null;

  mondayUpdatedAt: string | null;
  syncedAt: string;
  createdAt: string;
}

export interface ProjectFilters {
  /** Trigram match across name + code + client_name_text. */
  search?: string;
  status?: string;
  class?: ProjectClass | "all";
  videoType?: ProjectVideoType | "all";
  invoiceStatus?: string;
  scammer?: "all" | "valid" | "scammer";
  /** YYYY-MM-DD inclusive. */
  timelineFrom?: string;
  timelineTo?: string;
  /** Narrow to a single client (used by the client detail page). */
  clientId?: string;
  sortBy?: "timeline_start" | "monday_updated_at" | "paypal_income";
  sortDir?: "asc" | "desc";
  /** 1-based. */
  page?: number;
  /** Default 50. */
  pageSize?: number;
}

export interface ProjectListResult {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Status labels we treat as "active" (vs done/archived/scammer).
 * Sourced from Monday "Status" column values.
 */
export const ACTIVE_PROJECT_STATUSES = [
  "Waiting",
  "In progress",
  "Revisions",
  "Internal revisions",
  "Ready For Approval",
  "Ready to Send",
  "Uploading",
] as const;

export type ActiveProjectStatus = (typeof ACTIVE_PROJECT_STATUSES)[number];

/**
 * Build a Supabase `.or()` clause that matches any of the active status
 * labels case-insensitively. Some Monday rows have "In Progress" with a
 * capital P, others "In progress" — case-insensitive matching catches
 * both without us having to hardcode every variant.
 */
export const ACTIVE_PROJECT_STATUS_OR_CLAUSE = ACTIVE_PROJECT_STATUSES.map(
  (s) => `status.ilike.${s}`,
).join(",");

export interface ProjectStats {
  totalActive: number;
  totalDone: number;
  scammerCount: number;
  totalRevenueCentsThisMonth: number;
}
