import { Briefcase, DollarSign, Eye, Users } from "lucide-react";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { RecentActivityFeed } from "@/components/admin/overview/RecentActivityFeed";
import { StatsCard } from "@/components/admin/overview/StatsCard";
import { TopVideosBarChart } from "@/components/admin/overview/TopVideosBarChart";
import { VisitorsLineChart } from "@/components/admin/overview/VisitorsLineChart";
import { formatInteger, formatUsdCents } from "@/lib/admin/format";
import {
  getAnalyticsService,
  getReportsService,
} from "@/services/admin";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  // Run reports + analytics in parallel — both can be slow. Each
  // service throws on failure rather than returning empty so we'd see
  // errors loudly; for a v1 we let them propagate to the error boundary.
  const [snapshot, reports] = await Promise.all([
    getAnalyticsService().getSnapshot(),
    getReportsService().getOverview(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Overview
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Last 30 days · live data from Supabase + Monday sync.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Visitors (30d)"
          value={formatInteger(snapshot.totalVisitorsLast30d)}
          hint="last 30 days"
          icon={Eye}
        />
        <StatsCard
          label="Active clients"
          value={formatInteger(reports.totalActiveClients)}
          hint="excluding inactive"
          icon={Users}
        />
        <StatsCard
          label="Active projects"
          value={formatInteger(reports.totalActiveProjects)}
          hint="in progress + review"
          icon={Briefcase}
        />
        <StatsCard
          label="Revenue this month"
          value={formatUsdCents(reports.totalRevenueCentsThisMonth)}
          hint={`${reports.newClientsThisMonth} new clients`}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Visitors trend"
            description="Daily page views, last 30 days"
          />
          <div className="px-2 pb-3 pt-3">
            <VisitorsLineChart data={snapshot.pageViewsTrend} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Top videos"
            description="By total plays — top 5"
          />
          <div className="px-2 pb-3 pt-3">
            <TopVideosBarChart data={snapshot.videoMetrics} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent activity"
          description="Latest 10 events from the landing page"
        />
        <RecentActivityFeed events={snapshot.recentEvents} />
      </Card>
    </div>
  );
}
