import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ExportButton } from "./ExportButton";
import { PeriodTabs } from "./PeriodTabs";
import { BreakdownBarChart } from "./charts/BreakdownBarChart";
import { PROJECT_VIDEO_TYPE_LABELS } from "@/lib/admin/format";
import { getReportsService } from "@/services/admin";
import type { ReportPeriod } from "@/types/reports";

export async function ServiceBreakdownSection({
  period,
}: {
  period: ReportPeriod;
}) {
  const reports = getReportsService();
  const [byVideoType, byClass, popular] = await Promise.all([
    reports.getCountByVideoType(period),
    reports.getCountByClass(period),
    reports.getPopularCombinations(period, 6),
  ]);

  const videoTypeChart = byVideoType.map((b) => ({
    label: PROJECT_VIDEO_TYPE_LABELS[b.videoType],
    value: b.count,
  }));
  const classChart = byClass.map((b) => ({
    label: `Class ${b.class}`,
    value: b.count,
  }));
  const popularChart = popular.map((p) => ({
    label: `${p.class} · ${PROJECT_VIDEO_TYPE_LABELS[p.videoType]}`,
    value: p.count,
  }));

  return (
    <Card>
      <CardHeader
        title="Service Breakdown"
        description="Project counts by category"
        actions={
          <div className="flex items-center gap-2">
            <PeriodTabs param="breakdownPeriod" current={period} />
            <ExportButton
              filename={`service-breakdown-${period}`}
              headers={["Group", "Bucket", "Count"]}
              rows={[
                ...byVideoType.map((b) => [
                  "Video type",
                  PROJECT_VIDEO_TYPE_LABELS[b.videoType],
                  b.count,
                ]),
                ...byClass.map((b) => ["Class", `Class ${b.class}`, b.count]),
                ...popular.map((p) => [
                  "Combination",
                  `${p.class} · ${PROJECT_VIDEO_TYPE_LABELS[p.videoType]}`,
                  p.count,
                ]),
              ]}
            />
          </div>
        }
      />
      <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <h4 className="mb-2 font-body text-xs uppercase tracking-wide text-ink-faint">
            By video type
          </h4>
          <BreakdownBarChart data={videoTypeChart} format="integer" />
        </div>
        <div>
          <h4 className="mb-2 font-body text-xs uppercase tracking-wide text-ink-faint">
            By class
          </h4>
          <BreakdownBarChart data={classChart} format="integer" />
        </div>
        <div>
          <h4 className="mb-2 font-body text-xs uppercase tracking-wide text-ink-faint">
            Most popular combinations
          </h4>
          <BreakdownBarChart data={popularChart} format="integer" />
        </div>
      </CardBody>
    </Card>
  );
}
