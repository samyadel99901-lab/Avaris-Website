"use client";

import { RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { formatDateTime, formatRelative } from "@/lib/admin/format";
import type { SyncRun } from "@/types/sync";

/**
 * Sync status card for /admin/settings.
 *
 * Shows the most-recent sync run + a "Sync now" button that POSTs to
 * /api/admin/sync-monday/run. The route enforces super_admin; the
 * button is disabled (with tooltip) for non-super admins.
 */
export function SyncStatusCard({
  initialLastRun,
  isSuperAdmin,
}: {
  initialLastRun: SyncRun | null;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState(initialLastRun);

  const triggerSync = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync-monday/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "incremental" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? `HTTP ${res.status}`);
      } else if (json.skipped) {
        setMessage(`Skipped: ${json.reason}`);
      } else {
        const c = json.clients;
        const p = json.projects;
        setMessage(
          `Synced — clients: ${c?.itemsFetched ?? 0}, projects: ${p?.itemsFetched ?? 0}`,
        );
      }
      // Refresh the status row.
      const statusRes = await fetch("/api/admin/sync-monday/status", {
        cache: "no-store",
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        setLastRun(data.lastRun ?? null);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Monday.com sync"
        description="Auto-runs every 30 min in production"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={triggerSync}
            disabled={running || !isSuperAdmin}
            title={
              isSuperAdmin
                ? "Run incremental sync now"
                : "Super admin only"
            }
          >
            <RefreshCcw
              size={14}
              strokeWidth={1.75}
              className={running ? "animate-spin" : ""}
            />
            {running ? "Syncing…" : "Sync now"}
          </Button>
        }
      />
      <CardBody>
        {lastRun ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 font-body text-sm sm:grid-cols-2">
            <Row
              label="Status"
              value={
                <Badge tone={statusTone(lastRun.status)}>
                  {lastRun.status}
                </Badge>
              }
            />
            <Row
              label="Mode"
              value={<span className="text-ink-muted">{lastRun.mode}</span>}
            />
            <Row
              label="Started"
              value={formatDateTime(lastRun.startedAt)}
            />
            <Row
              label="Finished"
              value={
                lastRun.finishedAt
                  ? formatRelative(lastRun.finishedAt)
                  : "—"
              }
            />
            <Row
              label="Items fetched"
              value={lastRun.itemsFetched.toLocaleString("en-US")}
            />
            <Row
              label="Items failed"
              value={
                lastRun.itemsFailed > 0 ? (
                  <span className="text-rose-300">{lastRun.itemsFailed}</span>
                ) : (
                  "0"
                )
              }
            />
            <Row
              label="Triggered by"
              value={
                <span className="text-ink-muted">{lastRun.triggeredBy}</span>
              }
            />
            <Row
              label="Duration"
              value={
                lastRun.durationMs
                  ? `${Math.round(lastRun.durationMs / 1000)}s`
                  : "—"
              }
            />
            {lastRun.errorMessage && (
              <div className="sm:col-span-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2">
                <p className="font-body text-xs text-rose-200/80 whitespace-pre-wrap">
                  {lastRun.errorMessage}
                </p>
              </div>
            )}
          </dl>
        ) : (
          <p className="font-body text-sm text-ink-muted">
            No sync runs yet. Run{" "}
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">
              npm run sync:monday:initial
            </code>{" "}
            locally for the first time.
          </p>
        )}
        {message && (
          <p className="mt-3 font-body text-xs text-ink-muted">{message}</p>
        )}
      </CardBody>
    </Card>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function statusTone(
  status: SyncRun["status"],
): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (status) {
    case "success":
      return "success";
    case "running":
      return "info";
    case "partial":
      return "warning";
    case "failed":
      return "danger";
    case "skipped":
      return "neutral";
  }
}
