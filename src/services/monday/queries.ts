/**
 * GraphQL queries for the Monday → Supabase sync.
 *
 * Monday's items_page API is split in two:
 *   1. The FIRST page uses `boards(...)→items_page(query_params: ..., limit: ...)`
 *      where `query_params` carries filters / order_by. NO cursor allowed.
 *   2. Subsequent pages use the top-level `next_items_page(cursor, limit)`.
 *      It returns the same shape as items_page, but at the root of `data`,
 *      not nested under `boards[0].items_page`. NO query_params allowed.
 *
 * Mixing both in one query — `query_params` + `cursor` — fails with:
 *   "Invalid request: You must provide either a 'query_params' or a
 *    'cursor', but not both."
 *
 * The shared item fragment is inlined in both queries so they read
 * exactly the same shape (column_values is polymorphic, normalizers
 * pick the columns they need).
 */

const ITEM_FIELDS = /* GraphQL */ `
  id
  name
  updated_at
  group {
    id
    title
  }
  column_values {
    id
    type
    value
    text
    ... on BoardRelationValue { linked_item_ids }
    ... on FormulaValue       { display_value }
    ... on MirrorValue        { display_value }
    ... on StatusValue        { label }
    ... on DropdownValue      { values { label } }
    ... on NumbersValue       { number }
    ... on TimelineValue      { from to }
    ... on DateValue          { date }
    ... on CheckboxValue      { checked }
    ... on EmailValue         { email }
    ... on LinkValue          { url }
  }
`;

/**
 * First page only. Use `query_params` here (order by last-updated desc
 * so the incremental sync can break out as soon as it sees an item
 * older than the cutoff).
 */
export const GET_BOARD_ITEMS_FIRST_PAGE = /* GraphQL */ `
  query GetBoardItemsFirstPage($boardId: ID!, $limit: Int!) {
    boards(ids: [$boardId]) {
      items_page(
        limit: $limit,
        query_params: { order_by: [{ column_id: "__last_updated__", direction: desc }] }
      ) {
        cursor
        items { ${ITEM_FIELDS} }
      }
    }
  }
`;

/**
 * Subsequent pages. Top-level `next_items_page` — no `boards` wrapper
 * in the response.
 */
export const GET_BOARD_ITEMS_NEXT_PAGE = /* GraphQL */ `
  query GetBoardItemsNextPage($cursor: String!, $limit: Int!) {
    next_items_page(limit: $limit, cursor: $cursor) {
      cursor
      items { ${ITEM_FIELDS} }
    }
  }
`;

// ── Response shapes ──────────────────────────────────────────────────

/**
 * Catch-all column value shape — every field is optional because Monday
 * only returns the fragment fields that match the column's actual type.
 * The normalizers index by `id` and read whichever subset is relevant.
 */
export interface MondayColumnValue {
  id: string;
  type: string;
  /** Raw JSON-encoded value (fallback). */
  value: string | null;
  /** Human-readable display value Monday computes for us. */
  text: string | null;
  // Polymorphic fragments — only one will be populated per column type:
  linked_item_ids?: string[] | number[] | null;
  display_value?: string | null;
  label?: string | null;
  values?: { label: string }[] | null;
  number?: number | null;
  from?: string | null;
  to?: string | null;
  date?: string | null;
  checked?: boolean | null;
  email?: string | null;
  url?: string | null;
}

export interface MondayItem {
  id: string;
  name: string;
  updated_at: string;
  group: { id: string; title: string } | null;
  column_values: MondayColumnValue[];
}

export interface MondayItemsPage {
  cursor: string | null;
  items: MondayItem[];
}

/** Response shape for GET_BOARD_ITEMS_FIRST_PAGE. */
export interface MondayFirstPageResponse {
  boards: { items_page: MondayItemsPage }[];
}

/** Response shape for GET_BOARD_ITEMS_NEXT_PAGE. */
export interface MondayNextPageResponse {
  next_items_page: MondayItemsPage;
}

/**
 * Fetch a board's column definitions including `settings_str`. Used to
 * build a label index — dropdown columns return `value: '{"ids":[1]}'`,
 * and the only way to resolve id `1` to "A" / "Reel < 1min" / etc. is
 * via the column's settings JSON.
 *
 * Run once per sync at the start; columns rarely change.
 */
export const GET_BOARD_COLUMNS = /* GraphQL */ `
  query GetBoardColumns($boardId: ID!) {
    boards(ids: [$boardId]) {
      columns {
        id
        type
        title
        settings_str
      }
    }
  }
`;

export interface MondayBoardColumn {
  id: string;
  type: string;
  title: string;
  settings_str: string | null;
}

export interface MondayBoardColumnsResponse {
  boards: { columns: MondayBoardColumn[] }[];
}
