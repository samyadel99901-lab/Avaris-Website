/**
 * Generic per-board sync loop. Used for both clients and projects —
 * they only differ in normalize fn + table + boardId + cutoff column.
 *
 * Flow per call:
 *   1. Resolve cutoff (incremental only) by reading the latest
 *      successful sync_runs row for this source.
 *   2. Insert a sync_runs row (status=running).
 *   3. Snapshot the table row count.
 *   4. Walk Monday pages newest-first. In incremental mode, bail out
 *      as soon as we see an item older than the cutoff.
 *   5. Upsert in batches of 500 (well under PostgREST's 64K param cap).
 *   6. Snapshot again to compute insert vs update split.
 *   7. Update the sync_runs row with final stats.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SyncBoardResult,
  SyncMode,
  SyncProgressFn,
  SyncTrigger,
} from "@/types/sync";
import { mondayQuery } from "../client";
import {
  buildLabelIndex,
  chunk,
  type BoardLabelIndex,
} from "../helpers";
import type {
  MondayBoardColumnsResponse,
  MondayFirstPageResponse,
  MondayItem,
  MondayItemsPage,
  MondayNextPageResponse,
} from "../queries";
import {
  GET_BOARD_COLUMNS,
  GET_BOARD_ITEMS_FIRST_PAGE,
  GET_BOARD_ITEMS_NEXT_PAGE,
} from "../queries";

const PAGE_SIZE = 100;
const UPSERT_BATCH = 500;

interface SyncBoardOptions<TRow> {
  supabase: SupabaseClient;
  source: "monday_clients" | "monday_projects";
  boardId: string;
  table: "clients" | "projects";
  mode: SyncMode;
  triggeredBy: SyncTrigger;
  /** Receives the per-board label index so dropdown / status fallbacks
      can resolve `value` JSON ids to human labels. */
  normalize: (item: MondayItem, labelIndex: BoardLabelIndex) => TRow;
  onProgress?: SyncProgressFn;
  signal?: AbortSignal;
}

export async function syncBoard<TRow>(
  opts: SyncBoardOptions<TRow>,
): Promise<SyncBoardResult> {
  const {
    supabase,
    source,
    boardId,
    table,
    mode,
    triggeredBy,
    normalize,
    onProgress,
    signal,
  } = opts;

  const startedAtMs = Date.now();

  // 1. Resolve cutoff for incremental.
  let cutoff: string | null = null;
  let effectiveMode: SyncMode = mode;
  if (mode === "incremental") {
    const { data: lastSuccess } = await supabase
      .from("sync_runs")
      .select("finished_at")
      .eq("source", source)
      .eq("status", "success")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    cutoff = lastSuccess?.finished_at ?? null;
    if (!cutoff) effectiveMode = "full";
  }

  // 2. Fetch column settings once — used by the normalizer to resolve
  // dropdown/status `value` JSON ids when the typed label fragment is
  // empty (frequent in API 2024-10). Failures here aren't fatal: an
  // empty label index just means the typed/text fallbacks must carry it.
  let labelIndex: BoardLabelIndex = new Map();
  try {
    const colsResponse = await mondayQuery<MondayBoardColumnsResponse>(
      GET_BOARD_COLUMNS,
      { boardId },
      { signal },
    );
    labelIndex = buildLabelIndex(
      colsResponse.boards?.[0]?.columns ?? [],
    );
  } catch {
    /* keep going with an empty index */
  }

  // 3. Insert sync_runs row.
  const { data: run, error: runErr } = await supabase
    .from("sync_runs")
    .insert({
      source,
      status: "running",
      mode: effectiveMode,
      triggered_by: triggeredBy,
    })
    .select("id")
    .single();
  if (runErr || !run) {
    throw new Error(
      `Failed to insert sync_runs row for ${source}: ${runErr?.message ?? "unknown"}`,
    );
  }
  const runId = run.id;

  // 3. Snapshot table size — used to split insert vs update at the end.
  const { count: countBefore } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  // 4. Walk Monday pages.
  let cursor: string | null = null;
  let pageIndex = 0;
  let totalFetched = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  const accumulator: TRow[] = [];
  let reachedCutoff = false;
  let cursorRetried = false;

  while (true) {
    if (signal?.aborted) throw new Error("Sync aborted");

    let page: MondayItemsPage | null = null;
    try {
      if (cursor === null) {
        // First page — order_by lives in query_params; no cursor allowed.
        const firstPage: MondayFirstPageResponse =
          await mondayQuery<MondayFirstPageResponse>(
            GET_BOARD_ITEMS_FIRST_PAGE,
            { boardId, limit: PAGE_SIZE },
            { signal },
          );
        page = firstPage.boards?.[0]?.items_page ?? null;
      } else {
        // Subsequent pages — top-level next_items_page; no query_params.
        const nextPage: MondayNextPageResponse =
          await mondayQuery<MondayNextPageResponse>(
            GET_BOARD_ITEMS_NEXT_PAGE,
            { cursor, limit: PAGE_SIZE },
            { signal },
          );
        page = nextPage.next_items_page ?? null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Cursor expired (60s TTL) → restart once from cursor=null. Match
      // ONLY the "expired" wording — Monday's other "Invalid request"
      // errors mention the word cursor too and we don't want to mask
      // them by retrying.
      const isCursorExpired =
        cursor !== null &&
        (/cursor.*expir/i.test(msg) || /expired.*cursor/i.test(msg));
      if (isCursorExpired && !cursorRetried) {
        cursorRetried = true;
        cursor = null;
        accumulator.length = 0;
        totalFetched = 0;
        totalFailed = 0;
        errors.length = 0;
        pageIndex = 0;
        errors.push(`cursor expired — restarted from page 1 (${msg})`);
        continue;
      }
      await markRunFailed(supabase, runId, msg, totalFetched, totalFailed, startedAtMs);
      return failResult(source, totalFetched, totalFailed, msg);
    }

    if (!page) break;

    pageIndex++;
    const items = page.items ?? [];

    for (const item of items) {
      if (
        effectiveMode === "incremental" &&
        cutoff &&
        item.updated_at <= cutoff
      ) {
        reachedCutoff = true;
        break;
      }
      try {
        accumulator.push(normalize(item, labelIndex));
        totalFetched++;
      } catch (err) {
        totalFailed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`item ${item.id}: ${msg}`);
      }
    }

    onProgress?.({
      type: "page_fetched",
      source,
      pageIndex,
      itemsInPage: items.length,
      totalSoFar: totalFetched,
    });

    if (reachedCutoff) break;
    cursor = page.cursor;
    if (!cursor) break;
  }

  // 5. Batched upsert.
  let totalUpserted = 0;
  for (const batch of chunk(accumulator, UPSERT_BATCH)) {
    if (signal?.aborted) throw new Error("Sync aborted");
    // PostgREST upsert accepts arbitrary row shapes — cast to `never[]`
    // because supabase-js's generated types don't know about our tables
    // until we generate them, and we trust the normalizer's output.
    const { error: upsertErr } = await supabase
      .from(table)
      .upsert(batch as unknown as never[], { onConflict: "monday_item_id" });
    if (upsertErr) {
      totalFailed += batch.length;
      errors.push(`upsert batch: ${upsertErr.message}`);
      // Don't break — try remaining batches in case it was a one-off.
      continue;
    }
    totalUpserted += batch.length;
    onProgress?.({
      type: "batch_upserted",
      source,
      batchSize: batch.length,
      totalUpserted,
    });
  }

  // 6. Snapshot again → derive insert vs update.
  const { count: countAfter } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  const inserted = Math.max(0, (countAfter ?? 0) - (countBefore ?? 0));
  const updated = Math.max(0, totalUpserted - inserted);

  // 7. Final status + sync_runs update.
  const status: SyncBoardResult["status"] =
    errors.length === 0
      ? "success"
      : totalUpserted > 0
        ? "partial"
        : "failed";
  const errorMessage = errors.length ? errors.slice(0, 5).join("\n") : null;

  await supabase
    .from("sync_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      items_fetched: totalFetched,
      items_inserted: inserted,
      items_updated: updated,
      items_failed: totalFailed,
      error_message: errorMessage,
      duration_ms: Date.now() - startedAtMs,
    })
    .eq("id", runId);

  const result: SyncBoardResult = {
    source,
    status,
    itemsFetched: totalFetched,
    itemsInserted: inserted,
    itemsUpdated: updated,
    itemsFailed: totalFailed,
    errorMessage,
  };
  onProgress?.({ type: "source_done", result });
  return result;
}

async function markRunFailed(
  supabase: SupabaseClient,
  runId: string,
  msg: string,
  fetched: number,
  failed: number,
  startedAtMs: number,
): Promise<void> {
  await supabase
    .from("sync_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      items_fetched: fetched,
      items_failed: failed,
      error_message: msg,
      duration_ms: Date.now() - startedAtMs,
    })
    .eq("id", runId);
}

function failResult(
  source: SyncBoardResult["source"],
  fetched: number,
  failed: number,
  msg: string,
): SyncBoardResult {
  return {
    source,
    status: "failed",
    itemsFetched: fetched,
    itemsInserted: 0,
    itemsUpdated: 0,
    itemsFailed: failed,
    errorMessage: msg,
  };
}
