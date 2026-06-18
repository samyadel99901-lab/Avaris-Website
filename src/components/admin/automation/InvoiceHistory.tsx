"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { formatRelative } from "@/lib/admin/format";
import type { InvoiceHistoryRow } from "@/types/automation";

/** cents → "$1,234.00" */
function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Recent invoices the automation sent. Seeded with server-rendered data;
 * refetches after a send (when refreshKey increments past 0).
 */
export function InvoiceHistory({
  initial,
  refreshKey,
}: {
  initial: InvoiceHistoryRow[];
  refreshKey: number;
}) {
  const [rows, setRows] = useState<InvoiceHistoryRow[]>(initial);

  useEffect(() => {
    if (refreshKey === 0) return; // initial data came from the server
    let active = true;
    fetch("/api/admin/automation/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (active && Array.isArray(json.invoices)) setRows(json.invoices);
      })
      .catch(() => {
        /* keep current rows on error */
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return (
    <Card>
      <CardHeader title="History" description="Recent invoices sent" />
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-center font-body text-sm text-ink-muted">
            No invoices sent yet.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-left font-body text-xs uppercase tracking-wider text-ink-faint">
                <th className="px-5 py-3">Customer</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">When</th>
              </tr>
            </thead>
            <tbody className="font-body text-sm">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <span className="text-ink">{r.customerName ?? "—"}</span>
                    <span className="ml-2 text-xs text-ink-faint">
                      {r.customerEmail}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <Badge tone={r.status === "sent" ? "success" : "danger"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-right text-ink">
                    {usd(r.totalCents)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-muted">
                    {formatRelative(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
