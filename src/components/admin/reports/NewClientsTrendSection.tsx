import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ExportButton } from "./ExportButton";
import { MonthlyLineChart } from "./charts/MonthlyLineChart";
import { formatInteger } from "@/lib/admin/format";
import { getReportsService } from "@/services/admin";

export async function NewClientsTrendSection() {
  const data = await getReportsService().getNewClientsByMonth(12);
  const chartData = data.map((d) => ({ month: d.month, value: d.count }));

  // KPI: this month vs last month
  const last = data[data.length - 1]?.count ?? 0;
  const prev = data[data.length - 2]?.count ?? 0;
  const change =
    prev === 0 ? null : Math.round(((last - prev) / prev) * 100);

  return (
    <Card>
      <CardHeader
        title="New Clients"
        description="Last 12 months"
        actions={
          <ExportButton
            filename="new-clients-12mo"
            headers={["Month", "New clients"]}
            rows={data.map((d) => [d.month, d.count])}
          />
        }
      />
      <CardBody>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-display text-3xl text-ink">
            {formatInteger(last)}
          </span>
          <span className="font-body text-sm text-ink-muted">this month</span>
          {change !== null && (
            <span
              className={`font-body text-xs ${
                change >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}% vs last month
            </span>
          )}
        </div>
        <MonthlyLineChart data={chartData} format="integer" />
      </CardBody>
    </Card>
  );
}
