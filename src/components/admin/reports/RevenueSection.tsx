import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { StatsCard } from "@/components/admin/overview/StatsCard";
import { ExportButton } from "./ExportButton";
import { PeriodTabs } from "./PeriodTabs";
import { BreakdownPieChart } from "./charts/BreakdownPieChart";
import { MonthlyLineChart } from "./charts/MonthlyLineChart";
import {
  formatUsdCents,
  PROJECT_VIDEO_TYPE_LABELS,
} from "@/lib/admin/format";
import { getReportsService } from "@/services/admin";
import { DollarSign, TrendingUp } from "lucide-react";
import type {
  ProjectVideoType,
  ProjectClass,
} from "@/types/projects";
import type { ReportPeriod } from "@/types/reports";

export async function RevenueSection({ period }: { period: ReportPeriod }) {
  const reports = getReportsService();
  const [trend, byVideoType, byClass] = await Promise.all([
    reports.getRevenueTrend(12),
    reports.getRevenueByVideoType(period),
    reports.getRevenueByClass(period),
  ]);

  // KPI cards
  const thisMonth = trend[trend.length - 1]?.revenueCents ?? 0;
  const last3Months = trend.slice(-3).reduce((s, m) => s + m.revenueCents, 0);
  const ytd = trend.reduce((s, m) => s + m.revenueCents, 0);

  const trendChart = trend.map((d) => ({
    month: d.month,
    value: d.revenueCents / 100,
  }));

  const videoPieData = byVideoType.map((b) => ({
    label: PROJECT_VIDEO_TYPE_LABELS[b.bucket as ProjectVideoType] ?? b.bucket,
    value: b.revenueCents / 100,
  }));
  const classPieData = byClass.map((b) => ({
    label: `Class ${b.bucket as ProjectClass}`,
    value: b.revenueCents / 100,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="This month"
          value={formatUsdCents(thisMonth)}
          icon={DollarSign}
        />
        <StatsCard
          label="Last 3 months"
          value={formatUsdCents(last3Months)}
          icon={TrendingUp}
        />
        <StatsCard
          label="Last 12 months"
          value={formatUsdCents(ytd)}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader
          title="Revenue trend"
          description="Last 12 months · USD"
          actions={
            <ExportButton
              filename="revenue-trend-12mo"
              headers={["Month", "Revenue (USD)"]}
              rows={trend.map((d) => [d.month, (d.revenueCents / 100).toFixed(2)])}
            />
          }
        />
        <CardBody>
          <MonthlyLineChart
            data={trendChart}
            color="rgb(16 185 129)"
            format="usd"
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Revenue by service"
            actions={<PeriodTabs param="revenuePeriod" current={period} />}
          />
          <CardBody>
            <BreakdownPieChart data={videoPieData} format="usd" />
            <Legend rows={byVideoType.map((b) => ({
              label: PROJECT_VIDEO_TYPE_LABELS[b.bucket as ProjectVideoType] ?? b.bucket,
              value: formatUsdCents(b.revenueCents),
              percent: b.percentage,
            }))} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue by class" />
          <CardBody>
            <BreakdownPieChart data={classPieData} format="usd" />
            <Legend rows={byClass.map((b) => ({
              label: `Class ${b.bucket}`,
              value: formatUsdCents(b.revenueCents),
              percent: b.percentage,
            }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Legend({
  rows,
}: {
  rows: { label: string; value: string; percent: number }[];
}) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-2">
          <span className="truncate text-ink-muted">{r.label}</span>
          <span className="text-ink">
            {r.value}{" "}
            <span className="text-ink-faint">({r.percent.toFixed(1)}%)</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
