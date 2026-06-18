"use client";

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCcw,
  Send,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { cn } from "@/lib/utils";
import type {
  EligibleResult,
  InvoiceHistoryRow,
  SendReport,
} from "@/types/automation";
import { InvoiceHistory } from "./InvoiceHistory";

/** cents → "$1,234.00" */
function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function AutomationClient({
  isSuperAdmin,
  initialData,
  initialError,
  initialHistory,
}: {
  isSuperAdmin: boolean;
  initialData: EligibleResult | null;
  initialError: string | null;
  initialHistory: InvoiceHistoryRow[];
}) {
  const [data, setData] = useState<EligibleResult | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<SendReport | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const load = useCallback(async (sync: boolean) => {
    if (sync) setSyncing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/automation/eligible${sync ? "?sync=1" : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as EligibleResult);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  const customers = data?.customers ?? [];
  const warnings = data?.warnings ?? [];

  const toggle = (email: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === customers.length
        ? new Set()
        : new Set(customers.map((c) => c.customerEmail)),
    );

  const toggleExpand = (email: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const selectedTotalCents = customers
    .filter((c) => selected.has(c.customerEmail))
    .reduce((s, c) => s + c.totalCents, 0);

  const send = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setReport(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/automation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: Array.from(selected) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setReport(json as SendReport);
      setHistoryKey((k) => k + 1);
      await load(false); // refresh the eligible list (sent ones drop off)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
            Automation
          </h1>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Review eligible customers and send PayPal invoices. Amounts come
            from each video&apos;s PayPal Income on Monday.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => load(true)}
          disabled={syncing || loading || sending}
          title="Sync from Monday, then recompute"
        >
          <RefreshCcw
            size={14}
            strokeWidth={1.75}
            className={syncing ? "animate-spin" : ""}
          />
          {syncing ? "Syncing…" : "Refresh from Monday"}
        </Button>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Eligible customers" value={String(customers.length)} />
        <Stat
          label="Eligible total"
          value={usd(data?.summary.totalCents ?? 0)}
        />
        <Stat label="Selected" value={String(selected.size)} />
        <Stat label="Selected total" value={usd(selectedTotalCents)} />
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-body text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* Eligible list */}
      <Card>
        <CardHeader
          title="Eligible to invoice"
          description={
            loading ? "Loading…" : `${customers.length} customer(s) ready`
          }
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={send}
              disabled={!isSuperAdmin || sending || selected.size === 0}
              title={
                isSuperAdmin
                  ? "Send invoices to the selected customers"
                  : "Super admin only"
              }
            >
              <Send size={14} strokeWidth={1.75} />
              {sending
                ? "Sending…"
                : `Send ${selected.size || ""} invoice${
                    selected.size === 1 ? "" : "s"
                  }`.trim()}
            </Button>
          }
        />
        <CardBody className="p-0">
          {loading ? (
            <p className="px-5 py-8 text-center font-body text-sm text-ink-muted">
              Loading eligible customers…
            </p>
          ) : customers.length === 0 ? (
            <p className="px-5 py-8 text-center font-body text-sm text-ink-muted">
              No customers are eligible right now.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-left font-body text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={selected.size === customers.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-2 py-3 w-8" />
                  <th className="px-2 py-3">Customer</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3 text-right">Videos</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="font-body text-sm">
                {customers.map((c) => {
                  const isOpen = expanded.has(c.customerEmail);
                  return (
                    <FragmentRow
                      key={c.customerEmail}
                      open={isOpen}
                      checked={selected.has(c.customerEmail)}
                      onCheck={() => toggle(c.customerEmail)}
                      onExpand={() => toggleExpand(c.customerEmail)}
                      name={c.customerName}
                      email={c.customerEmail}
                      videoCount={c.videos.length}
                      total={usd(c.totalCents)}
                      videos={c.videos.map((v) => ({
                        id: v.mondayItemId,
                        name: v.projectName,
                        status: v.invoiceStatus,
                        amount: usd(v.amountCents),
                      }))}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Send report */}
      {report && (
        <Card>
          <CardHeader
            title="Last send"
            description={`${report.summary.sent} sent · ${report.summary.failed} failed · ${report.summary.skipped} skipped`}
          />
          <CardBody className="flex flex-col gap-2 font-body text-sm">
            {report.successful.map((s) => (
              <div key={s.customerEmail} className="flex items-center gap-2">
                <Badge tone="success">
                  {s.action === "appended" ? "updated + reminder" : "sent"}
                </Badge>
                <span className="text-ink">{s.customerName}</span>
                <span className="text-ink-muted">
                  {usd(s.totalCents)} · {s.itemsCount} item(s)
                  {s.action === "appended"
                    ? " · added to existing invoice"
                    : ""}
                </span>
                {s.mondayUpdateFailedItemIds &&
                  s.mondayUpdateFailedItemIds.length > 0 && (
                    <span className="text-amber-300">
                      · ⚠ Monday not updated for{" "}
                      {s.mondayUpdateFailedItemIds.length} item(s)
                    </span>
                  )}
              </div>
            ))}
            {report.failed.map((f) => (
              <div key={f.customerEmail} className="flex items-start gap-2">
                <Badge tone="danger">failed</Badge>
                <span className="text-ink">{f.customerName}</span>
                <span className="text-rose-200/80">{f.reason}</span>
              </div>
            ))}
            {report.skipped.map((s, i) => (
              <div key={`${s.customerEmail}-${i}`} className="flex items-start gap-2">
                <Badge tone="neutral">skipped</Badge>
                <span className="text-ink-muted">
                  {s.customerEmail} — {s.reason}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Warnings (skipped customers) */}
      {warnings.length > 0 && (
        <Card>
          <CardHeader
            title="Skipped"
            description={`${warnings.length} customer(s)/project(s) excluded`}
          />
          <CardBody className="flex flex-col gap-2 font-body text-sm">
            {warnings.map((w, i) => (
              <div
                key={`${w.customerEmail ?? w.mondayItemId ?? i}`}
                className="flex items-start gap-2"
              >
                <AlertTriangle
                  size={15}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <span className="text-ink">
                  {w.customerName ?? w.projectName ?? "—"}
                </span>
                <span className="text-ink-muted">— {w.reason}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <InvoiceHistory initial={initialHistory} refreshKey={historyKey} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="font-body text-xs uppercase tracking-wider text-ink-faint">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      </CardBody>
    </Card>
  );
}

function FragmentRow({
  open,
  checked,
  onCheck,
  onExpand,
  name,
  email,
  videoCount,
  total,
  videos,
}: {
  open: boolean;
  checked: boolean;
  onCheck: () => void;
  onExpand: () => void;
  name: string;
  email: string;
  videoCount: number;
  total: string;
  videos: { id: number; name: string; status: string | null; amount: string }[];
}) {
  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.02]">
        <td className="px-5 py-3">
          <input
            type="checkbox"
            aria-label={`Select ${name}`}
            checked={checked}
            onChange={onCheck}
          />
        </td>
        <td className="px-2 py-3">
          <button
            type="button"
            onClick={onExpand}
            aria-label={open ? "Collapse" : "Expand"}
            className="text-ink-muted hover:text-ink"
          >
            {open ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </td>
        <td className="px-2 py-3 text-ink">{name}</td>
        <td className="px-2 py-3 text-ink-muted">{email}</td>
        <td className="px-2 py-3 text-right text-ink-muted">{videoCount}</td>
        <td className="px-5 py-3 text-right font-medium text-ink">{total}</td>
      </tr>
      {open && (
        <tr className="border-b border-white/5 bg-white/[0.015]">
          <td />
          <td />
          <td colSpan={4} className="px-2 py-2">
            <div className="flex flex-col gap-1">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded px-2 py-1.5",
                    "text-xs",
                  )}
                >
                  <span className="text-ink">{v.name}</span>
                  <span className="flex items-center gap-3">
                    {v.status && (
                      <Badge tone="neutral">{v.status}</Badge>
                    )}
                    <span className="text-ink-muted">{v.amount}</span>
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
