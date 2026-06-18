/**
 * Shared helpers for Monday → Supabase sync.
 */

import type { MondayBoardColumn, MondayColumnValue } from "./queries";

/** Index column_values by id for O(1) lookup in normalizers. */
export function indexColumnValues(
  values: MondayColumnValue[],
): Record<string, MondayColumnValue> {
  const out: Record<string, MondayColumnValue> = {};
  for (const cv of values) out[cv.id] = cv;
  return out;
}

/** Convert a number-of-dollars to integer cents. Returns null if input is null/undefined. */
export function dollarsToCents(n: number | null | undefined): number | null {
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

/** Same as `dollarsToCents` but defaults missing values to 0 (for required columns). */
export function dollarsToCentsOrZero(n: number | null | undefined): number {
  return dollarsToCents(n) ?? 0;
}

/**
 * Parse a Monday formula's `display_value` into a finite number, or
 * null when the formula didn't produce a usable value.
 *
 * Why null instead of 0: the fallback chain (PayPal Income → Samy's
 * PayPal → Deposit) needs to distinguish "formula returned a real
 * zero" from "formula didn't compute". Returning 0 short-circuits the
 * fallback. Returning null lets it advance.
 *
 * Sentinels Monday is known to emit when the formula has nothing to
 * compute (typically because the source columns are blank):
 *   - the literal 4-char string "null" / "NULL"
 *   - "undefined", "N/A"
 *   - "#ERROR", "#N/A", "#REF!", "#NAME?", "#DIV/0!"
 *   - empty string after stripping currency symbols
 */
export function parseFormulaNumber(
  display: string | null | undefined,
): number | null {
  if (display == null) return null;
  const trimmed = String(display).trim();
  if (trimmed === "") return null;

  const lower = trimmed.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "n/a") {
    return null;
  }
  if (lower.startsWith("#")) return null; // spreadsheet error sentinels

  // Strip currency symbols, commas, spaces — keep digits, decimal, sign.
  const cleaned = trimmed.replace(/[^\d.\-+]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "+") {
    return null;
  }
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a date string from any of Monday's wire formats into YYYY-MM-DD.
 * Accepts plain dates, ISO timestamps, "YYYY-MM-DD HH:MM:SS", etc.
 * Returns null on unparseable input.
 */
export function parseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  // Fast path: already YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try as ISO / general date string.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ── Defensive column readers ─────────────────────────────────────────
// Each one prefers the typed GraphQL fragment field, falls back to the
// always-present `text`, then the raw `value` JSON. Necessary because
// Monday API versions vary in which typed fields they expose, and
// `text`/`value` are guaranteed for every column type.

/**
 * Read a status column's selected label.
 * Status columns return: { label: "Done", text: "Done", value: '{"index":2,"label":...}' }
 */
export function readStatusLabel(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  if (cv.label?.trim()) return cv.label.trim();
  if (cv.text?.trim()) return cv.text.trim();
  // Last resort — pull from raw JSON.
  if (cv.value) {
    try {
      const parsed = JSON.parse(cv.value);
      if (typeof parsed?.label === "string" && parsed.label.trim()) {
        return parsed.label.trim();
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Read the FIRST selected label of a dropdown column. Multi-select
 * dropdowns return labels comma-separated in `text`; we only care
 * about the first because the AVARIS columns we map are single-select
 * in practice.
 */
export function readDropdownFirstLabel(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  const fragmentLabel = cv.values?.[0]?.label?.trim();
  if (fragmentLabel) return fragmentLabel;
  if (cv.text?.trim()) {
    const first = cv.text.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

/**
 * Read a formula column's evaluated value as a string.
 * Some Monday API versions populate `display_value`, others only `text`.
 */
export function readFormulaValue(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  return (
    cv.display_value?.trim() ||
    cv.text?.trim() ||
    null
  );
}

/**
 * Read a numbers column's value. NumbersValue exposes a typed `number`
 * field but it's not always populated — fall back to parsing `text`.
 */
export function readNumber(
  cv: MondayColumnValue | undefined,
): number | null {
  if (!cv) return null;
  if (typeof cv.number === "number" && !Number.isNaN(cv.number)) {
    return cv.number;
  }
  if (cv.text?.trim()) {
    const n = Number.parseFloat(cv.text.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Read a timeline column's start + end dates. Falls back to scanning
 * the `text` field for two YYYY-MM-DD tokens when the typed fragment
 * fields are missing.
 */
export function readTimelineRange(
  cv: MondayColumnValue | undefined,
): { start: string | null; end: string | null } {
  if (!cv) return { start: null, end: null };
  let start = parseDate(cv.from);
  let end = parseDate(cv.to);
  if (!start || !end) {
    if (cv.text) {
      const matches = cv.text.match(/\d{4}-\d{2}-\d{2}/g);
      if (matches && matches.length > 0) {
        start = start ?? matches[0] ?? null;
        end = end ?? matches[1] ?? null;
      }
    }
    if (!start && cv.value) {
      try {
        const parsed = JSON.parse(cv.value);
        start = start ?? parseDate(parsed?.from);
        end = end ?? parseDate(parsed?.to);
      } catch {
        /* ignore */
      }
    }
  }
  return { start, end };
}

/** Read a date column's value. */
export function readDate(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  return parseDate(cv.date) ?? parseDate(cv.text) ?? null;
}

/** Read free-form text column. */
export function readText(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  return cv.text?.trim() || null;
}

// ── Linked items (board_relation) ────────────────────────────────────

/**
 * Read all linked item ids from a `board_relation` column. Returns an
 * empty array when nothing is linked or the input is missing.
 *
 * Defensive against API shape drift — tries in order:
 *   1. Typed fragment `linked_item_ids` (cleanest)
 *   2. Raw `value` JSON, which has historically been one of:
 *        {"linkedPulseIds":[{"linkedPulseId":12345}]}
 *        {"linkedPulseIds":[12345]}
 *        {"linked_pulse_ids":[12345]}
 *        {"item_ids":[12345]}
 *        {"linkedItemIds":[12345]}
 *
 * Never falls back to `text` — that returns the linked item NAME, not
 * the id, and silently corrupts FK resolution.
 */
export function readLinkedItemIds(
  cv: MondayColumnValue | undefined,
): number[] {
  if (!cv) return [];

  // 1. Typed fragment.
  if (Array.isArray(cv.linked_item_ids) && cv.linked_item_ids.length > 0) {
    return cv.linked_item_ids
      .map((x) => toItemId(x))
      .filter((n): n is number => n !== null);
  }

  // 2. Raw value JSON.
  if (cv.value) {
    try {
      const parsed: unknown = JSON.parse(cv.value);
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        const candidates = [
          obj.linkedPulseIds,
          obj.linked_pulse_ids,
          obj.linkedItemIds,
          obj.linked_item_ids,
          obj.item_ids,
        ];
        for (const c of candidates) {
          if (!Array.isArray(c) || c.length === 0) continue;
          const ids = c
            .map((entry) => {
              if (entry && typeof entry === "object") {
                const inner = entry as Record<string, unknown>;
                return toItemId(
                  (inner.linkedPulseId ??
                    inner.linked_pulse_id ??
                    inner.id) as string | number | null | undefined,
                );
              }
              return toItemId(
                entry as string | number | null | undefined,
              );
            })
            .filter((n): n is number => n !== null);
          if (ids.length > 0) return ids;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return [];
}

// ── Board column-settings label index ────────────────────────────────

/**
 * Per-column id → label resolution table. Built once per sync from the
 * board's `columns { settings_str }` and consulted whenever a status /
 * dropdown column's typed `label` / `values[].label` / `text` are all
 * empty (which happens often in Monday API 2024-10).
 */
export type BoardLabelIndex = Map<string, Map<number, string>>;

/**
 * Parse a board's columns response into a label index.
 *
 * Two settings_str shapes we care about:
 *
 *   Dropdown (type "dropdown"):
 *     {"labels":[{"id":1,"name":"A"},{"id":2,"name":"B"}]}
 *
 *   Status (type "status" or "color"):
 *     {"labels":{"0":"Done","1":"In progress"}, ...}
 */
export function buildLabelIndex(
  columns: readonly MondayBoardColumn[],
): BoardLabelIndex {
  const out: BoardLabelIndex = new Map();
  for (const col of columns) {
    if (!col.settings_str) continue;
    let settings: unknown;
    try {
      settings = JSON.parse(col.settings_str);
    } catch {
      continue;
    }
    if (!settings || typeof settings !== "object") continue;
    const labels = (settings as { labels?: unknown }).labels;
    if (!labels) continue;

    const map = new Map<number, string>();

    // Dropdown shape: array of {id, name}
    if (Array.isArray(labels)) {
      for (const entry of labels) {
        if (entry && typeof entry === "object") {
          const e = entry as { id?: unknown; name?: unknown };
          const id = typeof e.id === "number" ? e.id : Number(e.id);
          if (Number.isFinite(id) && typeof e.name === "string") {
            map.set(id, e.name);
          }
        }
      }
    }
    // Status shape: object keyed by stringified index → label
    else if (typeof labels === "object") {
      for (const [k, v] of Object.entries(labels as Record<string, unknown>)) {
        const id = Number(k);
        if (Number.isFinite(id) && typeof v === "string") {
          map.set(id, v);
        } else if (
          Number.isFinite(id) &&
          v &&
          typeof v === "object" &&
          typeof (v as { name?: unknown }).name === "string"
        ) {
          // status_v2 / colored_status format: {"0": {"name": "Done", "color": "..."}}
          map.set(id, (v as { name: string }).name);
        }
      }
    }

    if (map.size > 0) out.set(col.id, map);
  }
  return out;
}

/**
 * Resolve a dropdown's selected label using (in order):
 *   1. typed `values[0].label`
 *   2. `text` first comma token
 *   3. `value` JSON `{ids:[N]}` looked up in the label index
 */
export function readDropdownLabel(
  cv: MondayColumnValue | undefined,
  columnId: string,
  index: BoardLabelIndex,
): string | null {
  if (!cv) return null;

  const fragmentLabel = cv.values?.[0]?.label?.trim();
  if (fragmentLabel) return fragmentLabel;

  if (cv.text?.trim()) {
    const first = cv.text.split(",")[0]?.trim();
    if (first) return first;
  }

  // settings-based fallback
  const labelMap = index.get(columnId);
  if (labelMap && cv.value) {
    try {
      const parsed = JSON.parse(cv.value);
      const ids = (parsed as { ids?: unknown }).ids;
      if (Array.isArray(ids) && ids.length > 0) {
        const id = typeof ids[0] === "number" ? ids[0] : Number(ids[0]);
        if (Number.isFinite(id)) {
          const label = labelMap.get(id);
          if (label) return label;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

/**
 * Resolve a status column's selected label. Same fallback chain as the
 * dropdown reader, except status `value` JSON uses `{index: N}` rather
 * than `{ids: [N]}`.
 */
export function readStatusLabelWithIndex(
  cv: MondayColumnValue | undefined,
  columnId: string,
  index: BoardLabelIndex,
): string | null {
  // Reuse the typed/text path — usually wins.
  const fromBasic = readStatusLabel(cv);
  if (fromBasic) return fromBasic;
  if (!cv) return null;

  const labelMap = index.get(columnId);
  if (labelMap && cv.value) {
    try {
      const parsed = JSON.parse(cv.value);
      const idx = (parsed as { index?: unknown }).index;
      const id = typeof idx === "number" ? idx : Number(idx);
      if (Number.isFinite(id)) {
        const label = labelMap.get(id);
        if (label) return label;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Parse Monday's "last updated" column into ISO timestamptz. Monday
 * returns the value either in `text` (free-form) or in `value` as JSON
 * with an `updated_at` field. We try `value` first then fall back.
 */
export function parseLastUpdated(
  cv: MondayColumnValue | undefined,
): string | null {
  if (!cv) return null;
  if (cv.value) {
    try {
      const parsed = JSON.parse(cv.value);
      const ts = parsed?.updated_at ?? parsed?.changed_at;
      if (typeof ts === "string") {
        const d = new Date(ts);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
    } catch {
      // fall through to text
    }
  }
  if (cv.text) {
    const d = new Date(cv.text);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

/**
 * Read the boolean state of a Monday checkbox column. Monday's checkbox
 * column may report state in three places depending on API version:
 *   - `checked: true` (typed fragment)
 *   - `value: '{"checked":"true"}'` (raw JSON)
 *   - `text: "v"` when checked, empty when not (legacy)
 */
export function parseCheckbox(cv: MondayColumnValue | undefined): boolean {
  if (!cv) return false;
  if (typeof cv.checked === "boolean") return cv.checked;
  if (cv.value) {
    try {
      const parsed = JSON.parse(cv.value);
      if (parsed?.checked === "true" || parsed?.checked === true) return true;
    } catch {
      /* ignore */
    }
  }
  return cv.text === "v" || cv.text === "true";
}

/**
 * Coerce a Monday id (string of digits) to a JS bigint-safe number.
 * Monday IDs fit comfortably under Number.MAX_SAFE_INTEGER for the
 * foreseeable future, so a Number is fine and avoids JSON-bigint hassle.
 */
export function toItemId(id: string | number | null | undefined): number | null {
  if (id === null || id === undefined) return null;
  const n = typeof id === "number" ? id : Number(id);
  return Number.isFinite(n) ? n : null;
}

/** Split an array into N-sized chunks. */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Format a duration as "Xm Ys" or "Ys". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
