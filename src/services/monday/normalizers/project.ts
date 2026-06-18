/**
 * Normalize a raw Monday item from the "Customer Projects" board into
 * the row shape we upsert into `public.projects`.
 *
 * Design notes:
 *   - We DON'T resolve `client_id` here. That's done after both syncs
 *     finish via `resolve_project_client_ids()`, which joins on
 *     `monday_client_item_id`.
 *   - PayPal income reads from "PayPal Income" (formula, newer column)
 *     first, falls back to "Samy's PayPal" (numbers, older column),
 *     stores null when both are empty so aggregates aren't poisoned
 *     by spurious zeros.
 *   - Dropdown/status extraction goes through the BoardLabelIndex so
 *     we can resolve `{"ids":[N]}` from the raw `value` when typed
 *     fragments aren't populated (Monday API 2024-10 leaves them empty
 *     more often than docs suggest).
 *   - Linked client ids never fall back to `text` — text is the linked
 *     item's NAME, not its id.
 */

import type { ProjectClass, ProjectVideoType } from "@/types/projects";
import { PROJECT_COLS, VIDEO_TYPE_MAP } from "../constants";
import {
  dollarsToCents,
  indexColumnValues,
  parseFormulaNumber,
  parseLastUpdated,
  readDropdownLabel,
  readFormulaValue,
  readLinkedItemIds,
  readNumber,
  readStatusLabelWithIndex,
  readText,
  readTimelineRange,
  toItemId,
  type BoardLabelIndex,
} from "../helpers";
import type { MondayItem } from "../queries";

export interface NormalizedProjectRow {
  monday_item_id: number;
  monday_group_id: string | null;
  name: string;
  code: string | null;
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
  /** USD cents. Null when neither PayPal Income nor Samy's PayPal has data. */
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
}

const PROJECT_CLASSES: readonly ProjectClass[] = ["A", "B", "C"];
function isProjectClass(s: string | null | undefined): s is ProjectClass {
  return !!s && (PROJECT_CLASSES as readonly string[]).includes(s);
}

export function normalizeProject(
  item: MondayItem,
  labelIndex: BoardLabelIndex,
): NormalizedProjectRow {
  const cv = indexColumnValues(item.column_values);
  const itemId = toItemId(item.id);
  if (itemId === null) {
    throw new Error(`Project item has invalid id: ${item.id}`);
  }

  // Class — first dropdown value, validated against the enum.
  const classLabel = readDropdownLabel(
    cv[PROJECT_COLS.classDropdown],
    PROJECT_COLS.classDropdown,
    labelIndex,
  );
  const classValue: ProjectClass | null = isProjectClass(classLabel)
    ? classLabel
    : null;

  // Video type — map the raw label, default to "other" when something
  // is set but not in our map; null when nothing's set at all.
  const videoTypeRaw = readDropdownLabel(
    cv[PROJECT_COLS.videoTypeDropdown],
    PROJECT_COLS.videoTypeDropdown,
    labelIndex,
  );
  const videoType: ProjectVideoType | null = videoTypeRaw
    ? VIDEO_TYPE_MAP[videoTypeRaw] ?? "other"
    : null;

  // Linked client id — typed fragment first, raw value JSON second.
  // NEVER falls back to `text` (which is the linked NAME).
  const linkedIds = readLinkedItemIds(cv[PROJECT_COLS.clientRelation]);
  const mondayClientItemId = linkedIds[0] ?? null;

  // Timeline.
  const { start: timelineStart, end: timelineEnd } = readTimelineRange(
    cv[PROJECT_COLS.timeline],
  );

  // Statuses — settings-aware so an empty typed `label` still resolves.
  const status = readStatusLabelWithIndex(
    cv[PROJECT_COLS.status],
    PROJECT_COLS.status,
    labelIndex,
  );
  const scammerLabel = readStatusLabelWithIndex(
    cv[PROJECT_COLS.scammer],
    PROJECT_COLS.scammer,
    labelIndex,
  );

  // Numbers — read with text fallback then convert.
  const depositRaw = readNumber(cv[PROJECT_COLS.deposit]);
  const samyPaypalRaw = readNumber(cv[PROJECT_COLS.samyPaypal]);
  const editorCostRaw = readNumber(cv[PROJECT_COLS.editorCost]);
  const bonusRaw = readNumber(cv[PROJECT_COLS.bonus]);

  // Invoice status — needed for the deposit fallback decision below.
  const invoiceStatus = readStatusLabelWithIndex(
    cv[PROJECT_COLS.invoiceStatus],
    PROJECT_COLS.invoiceStatus,
    labelIndex,
  );

  // ── Revenue extraction (4-rule fallback chain) ─────────────────────
  // Rule 1: "PayPal Income" formula column wins if it computed > 0.
  //         Critical: parseFormulaNumber rejects Monday's "null" /
  //         "#ERROR" sentinels so the chain advances when the formula
  //         couldn't compute (the case for ~3,300 pre-2026 projects).
  // Rule 2: Fall back to "Samy's PayPal" (the legacy column) if > 0.
  // Rule 3: Fall back to "Deposit" if > 0 AND invoice status is NOT
  //         "Not send" (invoice never went out — not real revenue) AND
  //         NOT "Deposit paid" (only the down-payment landed, full
  //         price not realized). For Paid / Pending / Archieved /
  //         Checked / etc, the deposit IS the project's value.
  // Rule 4: null when nothing usable was found.
  // All rule comparisons happen in DOLLARS — we convert to cents only
  // at the end so we never mistake "150 cents" for "150 dollars".
  const incomeDollars = parseFormulaNumber(
    readFormulaValue(cv[PROJECT_COLS.paypalIncome]),
  );
  const samyDollars = samyPaypalRaw;
  const depositDollars = depositRaw;

  let revenueDollars: number | null = null;
  if (incomeDollars !== null && incomeDollars > 0) {
    revenueDollars = incomeDollars;
  } else if (samyDollars !== null && samyDollars > 0) {
    revenueDollars = samyDollars;
  } else if (depositDollars !== null && depositDollars > 0) {
    const status = (invoiceStatus ?? "").toLowerCase().trim();
    const skip = status === "not send" || status === "deposit paid";
    if (!skip) revenueDollars = depositDollars;
  }

  const paypalIncomeCents =
    revenueDollars !== null ? Math.round(revenueDollars * 100) : null;

  return {
    monday_item_id: itemId,
    monday_group_id: item.group?.id ?? null,
    name: item.name,
    code: readText(cv[PROJECT_COLS.code]),
    client_name_text: readText(cv[PROJECT_COLS.clientText]),
    monday_client_item_id: mondayClientItemId,

    class: classValue,
    video_type: videoType,
    video_type_raw: videoTypeRaw,

    status,
    invoice_status: invoiceStatus,
    editor_pay_status: readStatusLabelWithIndex(
      cv[PROJECT_COLS.editorPayStatus],
      PROJECT_COLS.editorPayStatus,
      labelIndex,
    ),
    delivery_status: readStatusLabelWithIndex(
      cv[PROJECT_COLS.deliveryStatus],
      PROJECT_COLS.deliveryStatus,
      labelIndex,
    ),

    timeline_start: timelineStart,
    timeline_end: timelineEnd,

    paypal_income_cents: paypalIncomeCents,
    // Always persist the raw deposit + samy figures (regardless of
    // whether they fed into revenue) — the dashboard surfaces them
    // independently in the project detail card and may want them for
    // future deposit-tracking views.
    deposit_cents: dollarsToCents(depositDollars) ?? 0,
    samy_paypal_cents: dollarsToCents(samyDollars) ?? 0,
    // EGP columns store whole units, no × 100.
    editor_cost_egp: Math.round(editorCostRaw ?? 0),
    bonus_egp: Math.round(bonusRaw ?? 0),

    is_scammer: scammerLabel === "SCAMMER",

    client_eta: readText(cv[PROJECT_COLS.clientEta]),
    footage_link: readText(cv[PROJECT_COLS.footageLink]),
    final_video_link: readText(cv[PROJECT_COLS.finalVideoLink]),

    monday_updated_at:
      parseLastUpdated(cv[PROJECT_COLS.lastUpdated]) ??
      item.updated_at ??
      null,
    synced_at: new Date().toISOString(),
  };
}
