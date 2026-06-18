/**
 * AVARIS — Initial Monday → Supabase sync.
 *
 * Run once after the Phase 3 migration is applied. Pulls all 3,381
 * projects + 310 clients into Supabase. Idempotent — safe to re-run if
 * it fails partway through (upserts on monday_item_id).
 *
 * Run with: npm run sync:monday:initial
 *
 * Reads env from .env.local via @next/env so SESSION_SECRET, Monday +
 * Supabase keys all match what the server uses.
 */

import { loadEnvConfig } from "@next/env";
// Types-only import is safe: it doesn't trigger env.ts validation.
import type { SyncProgressFn } from "@/types/sync";

loadEnvConfig(process.cwd(), true);

// Value imports below MUST be dynamic — env.ts validates at module load,
// and that has to happen AFTER loadEnvConfig populates process.env.
async function main(): Promise<void> {
  const { runSync } = await import("@/services/monday/sync/runner");
  const { formatDuration } = await import("@/services/monday/helpers");

  console.log("");
  console.log("─".repeat(64));
  console.log(" AVARIS — Initial Monday → Supabase sync");
  console.log("─".repeat(64));
  console.log(
    " Pulling all clients + projects. ~3-5 minutes for ~3,700 items.",
  );
  console.log(
    " Safe to re-run if it fails partway through (upsert is idempotent).",
  );
  console.log("");

  const onProgress: SyncProgressFn = (event) => {
    if (event.type === "page_fetched") {
      const label =
        event.source === "monday_clients" ? "clients" : "projects";
      process.stdout.write(
        `\r  → ${label}: page ${event.pageIndex} fetched (${event.totalSoFar} items so far)         `,
      );
    } else if (event.type === "source_done") {
      process.stdout.write("\n");
      const r = event.result;
      console.log(
        `  ✓ ${r.source}: ${r.itemsFetched} fetched, ${r.itemsInserted} inserted, ${r.itemsUpdated} updated, ${r.itemsFailed} failed`,
      );
      if (r.errorMessage) console.log(`    ⚠  ${r.errorMessage}`);
    } else if (event.type === "links_resolved") {
      console.log(`  ✓ Linked ${event.count} projects to client rows`);
    }
  };

  try {
    const result = await runSync({
      mode: "full",
      triggeredBy: "manual_local",
      onProgress,
    });

    if (result.skipped) {
      console.log("");
      console.log(`⚠  Sync skipped: ${result.reason}`);
      console.log(
        "   Wait 15 minutes for the stale lock to clear, or check sync_runs table.",
      );
      process.exit(2);
    }

    const c = result.clients;
    const p = result.projects;
    const failed = (c?.itemsFailed ?? 0) + (p?.itemsFailed ?? 0);
    const ok = failed === 0 && c?.status !== "failed" && p?.status !== "failed";

    console.log("");
    console.log(ok ? "✅ Initial sync complete!" : "⚠  Sync finished with errors.");
    console.log("");
    console.log(
      `   Clients:                 ${c?.itemsFetched ?? 0} fetched, ${c?.itemsInserted ?? 0} inserted, ${c?.itemsUpdated ?? 0} updated, ${c?.itemsFailed ?? 0} failed`,
    );
    console.log(
      `   Projects:                ${p?.itemsFetched ?? 0} fetched, ${p?.itemsInserted ?? 0} inserted, ${p?.itemsUpdated ?? 0} updated, ${p?.itemsFailed ?? 0} failed`,
    );
    console.log(`   Resolved client links:   ${result.resolvedClientLinks}`);
    console.log(`   Total duration:          ${formatDuration(result.totalDurationMs)}`);
    console.log("");

    if (ok) {
      console.log("Next steps:");
      console.log("  1. Verify in Supabase: open Table Editor → clients / projects.");
      console.log('  2. Edit .env.local: set ADMIN_DATA_SOURCE="supabase".');
      console.log("  3. Restart the dev server: npm run dev");
      console.log("  4. The dashboard will now show real data.");
      console.log("");
      process.exit(0);
    } else {
      console.log(
        "Some items failed to sync. Check the sync_runs table for details and re-run.",
      );
      process.exit(1);
    }
  } catch (err) {
    console.error("");
    console.error("❌ Sync failed:");
    console.error(err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error("");
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
