/**
 * Normalize a raw Monday item from the "2025 Clients Data" board into
 * the row shape we upsert into `public.clients`.
 *
 * Returns the snake_case shape because the next stop is Supabase.
 */

import type { ClientStatus } from "@/types/clients";
import { CLIENT_COLS, CLIENT_GROUP_TO_STATUS } from "../constants";
import {
  dollarsToCents,
  indexColumnValues,
  parseCheckbox,
  parseDate,
  parseLastUpdated,
  readDate,
  readNumber,
  readStatusLabelWithIndex,
  readText,
  toItemId,
  type BoardLabelIndex,
} from "../helpers";
import type { MondayItem } from "../queries";

export interface NormalizedClientRow {
  monday_item_id: number;
  monday_group_id: string | null;
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
}

export function normalizeClient(
  item: MondayItem,
  labelIndex: BoardLabelIndex,
): NormalizedClientRow {
  const cv = indexColumnValues(item.column_values);
  const itemId = toItemId(item.id);
  if (itemId === null) {
    throw new Error(`Client item has invalid id: ${item.id}`);
  }

  const groupId = item.group?.id ?? null;
  const status: ClientStatus =
    (groupId && CLIENT_GROUP_TO_STATUS[groupId]) || "active";

  // Email column — Monday's typed `email` field exists in newer API
  // versions. Always falls back to text which is the same address.
  const emailCv = cv[CLIENT_COLS.email];
  const email = emailCv?.email?.trim() || emailCv?.text?.trim() || null;

  // Last project date — read with text fallback.
  const lastProjectDate = readDate(cv[CLIENT_COLS.lastProjectAt]);

  return {
    monday_item_id: itemId,
    monday_group_id: groupId,
    name: item.name,

    email,
    code: readText(cv[CLIENT_COLS.code]),
    country: readStatusLabelWithIndex(
      cv[CLIENT_COLS.country],
      CLIENT_COLS.country,
      labelIndex,
    ),
    team_leader: readStatusLabelWithIndex(
      cv[CLIENT_COLS.teamLeader],
      CLIENT_COLS.teamLeader,
      labelIndex,
    ),
    platform: readText(cv[CLIENT_COLS.platform]),
    eta: readText(cv[CLIENT_COLS.eta]),
    payment_schedule: readStatusLabelWithIndex(
      cv[CLIENT_COLS.paymentSchedule],
      CLIENT_COLS.paymentSchedule,
      labelIndex,
    ),

    price_a_less_1min_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.priceALess])),
    price_a_more_1min_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.priceAMore])),
    price_b_less_1min_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.priceBLess])),
    price_b_more_1min_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.priceBMore])),
    special_a_video_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.specAVideo])),
    special_a_reel_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.specAReel])),
    special_b_video_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.specBVideo])),
    special_b_reel_cents: dollarsToCents(readNumber(cv[CLIENT_COLS.specBReel])),

    price_class_c: readText(cv[CLIENT_COLS.classC]),

    is_special_deal: parseCheckbox(cv[CLIENT_COLS.isSpecialDeal]),
    needs_followup: parseCheckbox(cv[CLIENT_COLS.needsFollowup]),
    is_reconnecting: parseCheckbox(cv[CLIENT_COLS.isReconnecting]),

    last_project_at: lastProjectDate
      ? new Date(`${parseDate(lastProjectDate)}T00:00:00Z`).toISOString()
      : null,

    status,
    monday_updated_at:
      parseLastUpdated(cv["last_updated_mkkc20hn"]) ?? item.updated_at ?? null,
    synced_at: new Date().toISOString(),
  };
}
