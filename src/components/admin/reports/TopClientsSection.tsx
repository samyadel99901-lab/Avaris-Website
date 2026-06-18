import Link from "next/link";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { ExportButton } from "./ExportButton";
import { PeriodTabs } from "./PeriodTabs";
import { SubModeTabs } from "./SubModeTabs";
import { formatInteger, formatUsdCents } from "@/lib/admin/format";
import { getReportsService } from "@/services/admin";
import type { ReportPeriod } from "@/types/reports";

interface Props {
  period: ReportPeriod;
  mode: "count" | "revenue";
}

export async function TopClientsSection({ period, mode }: Props) {
  const reports = getReportsService();
  const items =
    mode === "count"
      ? await reports.getTopClientsByProjectCount(period, 10)
      : await reports.getTopClientsByRevenue(period, 10);

  const csvHeaders = [
    "Client",
    "Projects",
    "Total revenue (USD)",
    "Avg project (USD)",
  ];
  const csvRows = items.map((c) => [
    c.name,
    c.projectCount,
    (c.totalRevenueCents / 100).toFixed(2),
    (c.avgProjectValueCents / 100).toFixed(2),
  ]);

  return (
    <Card>
      <CardHeader
        title="Top Clients"
        description={`Top 10 by ${mode === "count" ? "project count" : "revenue"}`}
        actions={
          <div className="flex items-center gap-2">
            <SubModeTabs current={mode} />
            <PeriodTabs param="topPeriod" current={period} />
            <ExportButton
              filename={`top-clients-${mode}-${period}`}
              headers={csvHeaders}
              rows={csvRows}
              disabled={items.length === 0}
            />
          </div>
        }
      />
      {items.length === 0 ? (
        <p className="px-5 py-12 text-center font-body text-sm text-ink-muted">
          No data for this period yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/5 font-body text-xs text-ink-faint">
              <tr>
                <th className="px-5 py-2.5 font-medium uppercase tracking-wide">
                  Client
                </th>
                <th className="px-5 py-2.5 text-right font-medium uppercase tracking-wide">
                  Projects
                </th>
                <th className="px-5 py-2.5 text-right font-medium uppercase tracking-wide">
                  Revenue
                </th>
                <th className="px-5 py-2.5 text-right font-medium uppercase tracking-wide">
                  Avg / project
                </th>
              </tr>
            </thead>
            <tbody className="font-body text-sm">
              {items.map((c, i) => (
                <tr
                  key={c.clientId}
                  className="border-b border-white/5 last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <span className="text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>{" "}
                    <Link
                      href={`/admin/clients/${c.clientId}`}
                      className="text-ink hover:text-blue-300"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right text-ink">
                    {formatInteger(c.projectCount)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink">
                    {formatUsdCents(c.totalRevenueCents)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-muted">
                    {formatUsdCents(c.avgProjectValueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
