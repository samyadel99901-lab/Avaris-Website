/**
 * Monday → Supabase sync types. Backed by the public.sync_runs table.
 */

export type SyncSource = "monday_clients" | "monday_projects" | "monday_full";
export type SyncStatus =
  | "running"
  | "success"
  | "partial"
  | "failed"
  | "skipped";
export type SyncMode = "full" | "incremental";
export type SyncTrigger = "cron" | "manual_admin" | "manual_local";

export interface SyncRun {
  id: string;
  source: SyncSource;
  status: SyncStatus;
  mode: SyncMode;
  triggeredBy: SyncTrigger;
  startedAt: string;
  finishedAt: string | null;
  itemsFetched: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorMessage: string | null;
  durationMs: number | null;
}

/** Per-source result returned by syncBoard(). */
export interface SyncBoardResult {
  source: Exclude<SyncSource, "monday_full">;
  status: SyncStatus;
  itemsFetched: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorMessage: string | null;
}

export interface SyncResult {
  skipped: boolean;
  /** Reason set when skipped=true (e.g. "another sync running"). */
  reason?: string;
  clients: SyncBoardResult | null;
  projects: SyncBoardResult | null;
  resolvedClientLinks: number;
  totalDurationMs: number;
}

/** Optional progress hook the runner emits to the local sync script. */
export type SyncProgressEvent =
  | { type: "page_fetched"; source: SyncSource; pageIndex: number; itemsInPage: number; totalSoFar: number }
  | { type: "batch_upserted"; source: SyncSource; batchSize: number; totalUpserted: number }
  | { type: "source_done"; result: SyncBoardResult }
  | { type: "links_resolved"; count: number };

export type SyncProgressFn = (event: SyncProgressEvent) => void;
