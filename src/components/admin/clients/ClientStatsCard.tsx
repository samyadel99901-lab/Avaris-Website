import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import {
  formatRelative,
  formatUsdCents,
  formatInteger,
} from "@/lib/admin/format";
import type { Project } from "@/types/projects";

export function ClientStatsCard({
  projects,
  lastProjectAt,
}: {
  projects: Project[];
  lastProjectAt: string | null;
}) {
  // Skip projects with no PayPal data when summing — null means "no
  // income recorded", not "$0 deal", so treating it as 0 would distort
  // both the sum and the average (denominator would over-count).
  const projectsWithIncome = projects.filter(
    (p) => p.financials.paypalIncomeCents !== null,
  );
  const totalRevenueCents = projectsWithIncome.reduce(
    (s, p) => s + (p.financials.paypalIncomeCents ?? 0),
    0,
  );
  const avgValueCents =
    projectsWithIncome.length > 0
      ? Math.round(totalRevenueCents / projectsWithIncome.length)
      : 0;

  return (
    <Card>
      <CardHeader title="Stats" />
      <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total projects" value={formatInteger(projects.length)} />
        <Stat label="Total revenue" value={formatUsdCents(totalRevenueCents)} />
        <Stat label="Avg project" value={formatUsdCents(avgValueCents)} />
        <Stat label="Last project" value={formatRelative(lastProjectAt)} />
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className="mt-1 font-body text-base text-ink">{value}</p>
    </div>
  );
}
