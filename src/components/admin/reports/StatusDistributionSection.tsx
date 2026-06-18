import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ExportButton } from "./ExportButton";
import { BreakdownPieChart } from "./charts/BreakdownPieChart";
import { formatInteger } from "@/lib/admin/format";
import { getReportsService } from "@/services/admin";

export async function StatusDistributionSection() {
  const dist = await getReportsService().getStatusDistribution();
  const total = dist.reduce((s, d) => s + d.count, 0);
  const doneCount = dist.find((d) => d.status === "Done")?.count ?? 0;
  const completionRate =
    total > 0 ? ((doneCount / total) * 100).toFixed(1) : "0";

  const pieData = dist.map((d) => ({ label: d.status, value: d.count }));

  return (
    <Card>
      <CardHeader
        title="Project Status Distribution"
        description={`All ${formatInteger(total)} projects · completion rate ${completionRate}%`}
        actions={
          <ExportButton
            filename="status-distribution"
            headers={["Status", "Count", "Percentage"]}
            rows={dist.map((d) => [
              d.status,
              d.count,
              d.percentage.toFixed(1) + "%",
            ])}
          />
        }
      />
      <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownPieChart data={pieData} format="integer" />
        <ul className="flex flex-col gap-1 font-body text-sm">
          {dist.map((d) => (
            <li
              key={d.status}
              className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-b-0"
            >
              <span className="text-ink-muted">{d.status}</span>
              <span className="text-ink">
                {formatInteger(d.count)}{" "}
                <span className="text-ink-faint">
                  ({d.percentage.toFixed(1)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
