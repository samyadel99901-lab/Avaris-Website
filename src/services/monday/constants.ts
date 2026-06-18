/**
 * Monday.com board + column IDs for the AVARIS sync.
 *
 * Column IDs are pinned to whatever Monday's API exposed at the time we
 * wired this up. If you ever rename a column on the board, the ID stays
 * the same — only the title changes. So these are stable.
 */

import type { ClientStatus } from "@/types/clients";
import type { ProjectVideoType } from "@/types/projects";

export const MONDAY_BOARDS = {
  /** "2025 Clients Data" */
  clients: "6589322272",
  /** "Customer Projects" */
  projects: "6589241558",
} as const;

/**
 * Customer Projects board column IDs.
 * Used by the project normalizer to look up values in the column_values
 * array returned by Monday.
 */
export const PROJECT_COLS = {
  clientText: "text6__1",
  clientRelation: "connect_boards",
  code: "text__1",
  classDropdown: "dropdown_mkzdm4p1",
  videoTypeDropdown: "dropdown_mkzdd2a8",
  status: "status",
  timeline: "timeline",
  paypalIncome: "formula_mm1rbhcs",
  deposit: "numeric__1",
  bonus: "numbers0__1",
  samyPaypal: "numbers__1",
  editorCost: "numbers4__1",
  invoiceStatus: "status__1",
  editorPayStatus: "status_1__1",
  deliveryStatus: "color_mkzvk4gs",
  scammer: "color_mkyr5we4",
  clientEta: "dup__of_eta__1",
  footageLink: "text2__1",
  finalVideoLink: "final_video_link8__1",
  lastUpdated: "last_updated_mkkc20hn",
  /** Date-range (timeline) column the public "New Project" form writes to. */
  dateRange: "date_rangefaazxd8h",
} as const;

/** 2025 Clients Data board column IDs. */
export const CLIENT_COLS = {
  email: "mail__1",
  code: "code__1",
  country: "country__1",
  teamLeader: "team_leader__1",
  priceALess: "numeric_mkzb1539",
  priceAMore: "numeric_mkzbwhe0",
  priceBLess: "numeric_mkzb2ps0",
  priceBMore: "numeric_mkzbqs27",
  specAVideo: "numeric_mkzdt90y",
  specAReel: "numeric_mkzdx2wx",
  specBVideo: "numeric_mkzdfaj9",
  specBReel: "numeric_mkzdkt7s",
  classC: "text_mkxyhbhs",
  isSpecialDeal: "boolean_mkzbqyv8",
  platform: "text_mkqnh3rz",
  eta: "text_mknfptht",
  paymentSchedule: "day_to_payments__1",
  lastProjectAt: "date__1",
  needsFollowup: "boolean_mkv32y1f",
  isReconnecting: "boolean_mktnb3km",
} as const;

/**
 * Map from a Monday group_id (kept on each board item) to our internal
 * client status enum. Items in unknown groups fall back to "active" so
 * we never lose a client to a missing mapping.
 */
export const CLIENT_GROUP_TO_STATUS: Record<string, ClientStatus> = {
  group_mknf8wjv: "new",
  group_mm1243j0: "to_review",
  group_mkpt3vbc: "important",
  topics: "active",
  group_mkv37vyr: "quiet",
  group_mm0g69r6: "not_found",
  group_mkzhr5tq: "upset",
  group_mknfja89: "inactive",
};

/**
 * Map from the raw Monday "Video Type" dropdown label to our enum.
 * Anything unmapped is bucketed under "other"; the original label is
 * preserved on `projects.video_type_raw` for triage.
 */
export const VIDEO_TYPE_MAP: Record<string, ProjectVideoType> = {
  "Reel (less than 1min)": "reel_short",
  "Video (less than 1 min)": "video_short",
  "Reel (More than 1min)": "reel_long",
  "Video (more than 1min)": "video_long",
  "Photo Editing": "photo",
};

/** A fixed integer key for pg_advisory_lock — guards against parallel syncs. */
export const SYNC_ADVISORY_LOCK_KEY = 727363001;
