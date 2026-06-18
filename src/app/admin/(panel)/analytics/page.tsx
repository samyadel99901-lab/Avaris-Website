import { Card, CardHeader } from "@/components/admin/ui/Card";
import { ScrollDepthChart } from "@/components/admin/analytics/ScrollDepthChart";
import { TrafficSourcesPie } from "@/components/admin/analytics/TrafficSourcesPie";
import { VisitorsLineChart } from "@/components/admin/overview/VisitorsLineChart";
import { getAnalyticsService } from "@/services/admin";

export const metadata = { title: "Analytics" };

const num = new Intl.NumberFormat("en-US");
const pct = (v: number) => `${v}%`;

export default async function AnalyticsPage() {
  const s = await getAnalyticsService().getSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Analytics
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Visitor behaviour on the landing page · last 30 days · mock data.
        </p>
      </header>

      {/* Page views trend (full width) */}
      <Card>
        <CardHeader
          title="Page views"
          description="Daily total · last 30 days"
        />
        <div className="px-2 pb-3 pt-3">
          <VisitorsLineChart data={s.pageViewsTrend} />
        </div>
      </Card>

      {/* Video performance + Top CTAs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Video performance"
            description="Plays, unique viewers, watch %, completion"
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/5 text-left">
                <tr className="font-body text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-5 py-3 font-medium">Video</th>
                  <th className="px-5 py-3 font-medium">Views</th>
                  <th className="px-5 py-3 font-medium">Unique</th>
                  <th className="px-5 py-3 font-medium">Avg watch</th>
                  <th className="px-5 py-3 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {s.videoMetrics.map((v) => (
                  <tr key={v.videoSrc} className="font-body text-sm text-ink-muted">
                    <td className="px-5 py-3 text-ink">{v.videoLabel}</td>
                    <td className="px-5 py-3">{num.format(v.views)}</td>
                    <td className="px-5 py-3">{num.format(v.uniqueViewers)}</td>
                    <td className="px-5 py-3">{pct(v.avgWatchPercent)}</td>
                    <td className="px-5 py-3">{pct(v.completionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Top CTAs"
            description="Most-clicked links across the landing"
          />
          <ul className="divide-y divide-white/5">
            {s.topCtas.map((c) => (
              <li key={`${c.label}-${c.location}`} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-ink">{c.label}</p>
                  <p className="font-body text-xs text-ink-faint">{c.location}</p>
                </div>
                <div className="text-right">
                  <div className="font-body text-sm font-medium text-ink">
                    {num.format(c.count)}
                  </div>
                  <div className="font-body text-xs text-ink-faint">
                    {num.format(c.uniqueClicks)} unique
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Scroll depth + Traffic sources + Devices */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Scroll depth per section"
            description="Share of sessions that reached each landing section"
          />
          <ScrollDepthChart data={s.scrollDepth} />
        </Card>

        <Card>
          <CardHeader
            title="Traffic sources"
            description="Where visitors came from"
          />
          <div className="px-2 pb-3 pt-3">
            <TrafficSourcesPie data={s.trafficSources} />
          </div>
          <ul className="divide-y divide-white/5 px-5 pb-4">
            {s.trafficSources.map((t) => (
              <li
                key={t.source}
                className="flex items-center justify-between py-2 font-body text-xs text-ink-muted"
              >
                <span>{t.source}</span>
                <span className="text-ink">{t.percentage}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Devices + Top referrers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Devices" description="Visit share" />
          <ul className="flex flex-col gap-2 px-5 py-4">
            {s.devices.map((d) => (
              <li key={d.device}>
                <div className="mb-1 flex justify-between font-body text-xs">
                  <span className="capitalize text-ink-muted">{d.device}</span>
                  <span className="text-ink">{d.percentage}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Top referrers" description="Domains sending traffic" />
          <ul className="divide-y divide-white/5">
            {s.topReferrers.map((r) => (
              <li
                key={r.domain}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="font-body text-sm text-ink">{r.domain}</span>
                <span className="font-body text-sm text-ink-muted">
                  {num.format(r.count)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
