import { connection } from "next/server";
import { Suspense } from "react";
import { NewClientsTrendSection } from "@/components/admin/reports/NewClientsTrendSection";
import { RevenueSection } from "@/components/admin/reports/RevenueSection";
import { ServiceBreakdownSection } from "@/components/admin/reports/ServiceBreakdownSection";
import { StatusDistributionSection } from "@/components/admin/reports/StatusDistributionSection";
import { TopClientsSection } from "@/components/admin/reports/TopClientsSection";
import type { ReportPeriod } from "@/types/reports";

export const metadata = { title: "Reports" };

const VALID_PERIODS: ReportPeriod[] = ["month", "year", "all"];
function parsePeriod(
  raw: string | string[] | undefined,
  fallback: ReportPeriod = "month",
): ReportPeriod {
  if (typeof raw === "string" && (VALID_PERIODS as string[]).includes(raw)) {
    return raw as ReportPeriod;
  }
  return fallback;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;

  const topPeriod = parsePeriod(params.topPeriod);
  const topMode = params.topMode === "revenue" ? "revenue" : "count";
  const breakdownPeriod = parsePeriod(params.breakdownPeriod);
  const revenuePeriod = parsePeriod(params.revenuePeriod);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Reports
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Aggregated client + project insights from synced Monday data.
        </p>
      </header>

      {/* Each section is independently suspended so a slow query in one
          doesn't hold up the rest. */}
      <Suspense fallback={<SectionFallback />}>
        <TopClientsSection period={topPeriod} mode={topMode} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <NewClientsTrendSection />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <ServiceBreakdownSection period={breakdownPeriod} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <RevenueSection period={revenuePeriod} />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <StatusDistributionSection />
      </Suspense>
    </div>
  );
}

function SectionFallback() {
  return (
    <div className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/[0.02]" />
  );
}
