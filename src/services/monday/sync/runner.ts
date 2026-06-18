/**
 * Top-level Monday → Supabase sync orchestrator.
 *
 * Workflow:
 *   1. Sentinel check — if a "monday_full" run is already running and
 *      started less than 15 min ago, log + return { skipped: true }.
 *      The 15-min window protects against zombie locks if a previous
 *      run crashed without updating its row.
 *   2. Insert a top-level sync_runs row (source = monday_full).
 *   3. Sync clients first (projects FK depends on them existing).
 *   4. Sync projects.
 *   5. Run resolve_project_client_ids() to wire up FKs.
 *   6. Roll up clients + projects stats into the top-level row.
 */

import { env } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase";
import type {
  SyncMode,
  SyncProgressFn,
  SyncResult,
  SyncRun,
  SyncTrigger,
} from "@/types/sync";
import { normalizeClient } from "../normalizers/client";
import { normalizeProject } from "../normalizers/project";
import { syncBoard } from "./board";

const STALE_RUN_MINUTES = 15;

interface RunSyncOptions {
  mode: SyncMode;
  triggeredBy: SyncTrigger;
  onProgress?: SyncProgressFn;
  signal?: AbortSignal;
}

export async function runSync(opts: RunSyncOptions): Promise<SyncResult> {
  const supabase = getServiceRoleClient();
  const startedAtMs = Date.now();

  // 1. Sentinel check.
  const staleCutoff = new Date(
    Date.now() - STALE_RUN_MINUTES * 60_000,
  ).toISOString();
  const { data: alreadyRunning } = await supabase
    .from("sync_runs")
    .select("id")
    .eq("source", "monday_full")
    .eq("status", "running")
    .gt("started_at", staleCutoff)
    .limit(1)
    .maybeSingle();

  if (alreadyRunning) {
    await supabase.from("sync_runs").insert({
      source: "monday_full",
      status: "skipped",
      mode: opts.mode,
      triggered_by: opts.triggeredBy,
      finished_at: new Date().toISOString(),
      error_message: "Another sync is already running",
      duration_ms: 0,
    });
    return {
      skipped: true,
      reason: "another sync is already running",
      clients: null,
      projects: null,
      resolvedClientLinks: 0,
      totalDurationMs: 0,
    };
  }

  // 2. Top-level run row.
  const { data: topRun, error: topErr } = await supabase
    .from("sync_runs")
    .insert({
      source: "monday_full",
      status: "running",
      mode: opts.mode,
      triggered_by: opts.triggeredBy,
    })
    .select("id")
    .single();
  if (topErr || !topRun) {
    throw new Error(
      `Failed to insert top-level sync_runs row: ${topErr?.message ?? "unknown"}`,
    );
  }
  const topRunId = topRun.id;

  try {
    // 3. Clients first (FK dependency).
    const clients = await syncBoard({
      supabase,
      source: "monday_clients",
      boardId: env.MONDAY_BOARD_CLIENTS_ID,
      table: "clients",
      mode: opts.mode,
      triggeredBy: opts.triggeredBy,
      normalize: normalizeClient,
      onProgress: opts.onProgress,
      signal: opts.signal,
    });

    // 4. Projects.
    const projects = await syncBoard({
      supabase,
      source: "monday_projects",
      boardId: env.MONDAY_BOARD_PROJECTS_ID,
      table: "projects",
      mode: opts.mode,
      triggeredBy: opts.triggeredBy,
      normalize: normalizeProject,
      onProgress: opts.onProgress,
      signal: opts.signal,
    });

    // 5. Resolve project.client_id from monday_client_item_id.
    const { data: linkedRaw } = await supabase.rpc(
      "resolve_project_client_ids",
    );
    const resolvedClientLinks =
      typeof linkedRaw === "number" ? linkedRaw : 0;
    opts.onProgress?.({
      type: "links_resolved",
      count: resolvedClientLinks,
    });

    // 6. Roll up.
    const overallStatus =
      clients.status === "failed" || projects.status === "failed"
        ? "failed"
        : clients.status === "partial" || projects.status === "partial"
          ? "partial"
          : "success";

    const totalDurationMs = Date.now() - startedAtMs;
    // Dedupe identical messages — when clients + projects fail with the
    // same Monday error (e.g. token revoked, query shape rejected), no
    // value in showing it twice on the rollup row.
    const messages = [clients.errorMessage, projects.errorMessage].filter(
      (m): m is string => Boolean(m),
    );
    const errorMessage =
      messages.length > 0 ? Array.from(new Set(messages)).join("\n---\n") : null;

    await supabase
      .from("sync_runs")
      .update({
        status: overallStatus,
        finished_at: new Date().toISOString(),
        items_fetched: clients.itemsFetched + projects.itemsFetched,
        items_inserted: clients.itemsInserted + projects.itemsInserted,
        items_updated: clients.itemsUpdated + projects.itemsUpdated,
        items_failed: clients.itemsFailed + projects.itemsFailed,
        error_message: errorMessage,
        duration_ms: totalDurationMs,
      })
      .eq("id", topRunId);

    return {
      skipped: false,
      clients,
      projects,
      resolvedClientLinks,
      totalDurationMs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: msg,
        duration_ms: Date.now() - startedAtMs,
      })
      .eq("id", topRunId);
    throw err;
  }
}

/**
 * Read the most-recent monday_full sync run, used by:
 *   - GET /api/admin/sync-monday/status (admin UI)
 *   - /admin/settings page (display banner)
 */
export async function getLastSyncRun(): Promise<SyncRun | null> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sync_runs")
    .select("*")
    .eq("source", "monday_full")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return rowToSyncRun(data as SyncRunRow);
}

interface SyncRunRow {
  id: string;
  source: SyncRun["source"];
  status: SyncRun["status"];
  mode: SyncRun["mode"];
  triggered_by: SyncRun["triggeredBy"];
  started_at: string;
  finished_at: string | null;
  items_fetched: number;
  items_inserted: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  duration_ms: number | null;
}

function rowToSyncRun(row: SyncRunRow): SyncRun {
  return {
    id: row.id,
    source: row.source,
    status: row.status,
    mode: row.mode,
    triggeredBy: row.triggered_by,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    itemsFetched: row.items_fetched,
    itemsInserted: row.items_inserted,
    itemsUpdated: row.items_updated,
    itemsFailed: row.items_failed,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
  };
}
