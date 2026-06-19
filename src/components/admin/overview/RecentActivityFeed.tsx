import {
  ArrowUpRight,
  Eye,
  MousePointerClick,
  PlayCircle,
  Scroll,
  SkipForward,
  type LucideIcon,
} from "lucide-react";
import type { RecentEvent } from "@/types/admin";

const icons: Record<RecentEvent["eventType"], LucideIcon> = {
  page_view: Eye,
  video_play: PlayCircle,
  video_progress: SkipForward,
  cta_click: MousePointerClick,
  scroll_depth: Scroll,
  external_link: ArrowUpRight,
};

const tones: Record<RecentEvent["eventType"], string> = {
  page_view: "text-blue-300 bg-blue-500/10",
  video_play: "text-emerald-300 bg-emerald-500/10",
  video_progress: "text-emerald-300 bg-emerald-500/10",
  cta_click: "text-amber-300 bg-amber-500/10",
  scroll_depth: "text-ink-muted bg-white/5",
  external_link: "text-rose-300 bg-rose-500/10",
};

function relative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function RecentActivityFeed({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="px-5 py-8 text-center font-body text-sm text-ink-muted">
        No activity yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-white/5">
      {events.map((e) => {
        // Fall back for any event_type outside the known set (e.g. a legacy
        // row) so an unknown type can't crash the whole Analytics page.
        const Icon = icons[e.eventType] ?? Eye;
        const tone = tones[e.eventType] ?? "text-ink-muted bg-white/5";
        return (
          <li key={e.id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${tone}`}
            >
              <Icon size={14} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm text-ink">{e.summary}</p>
              <p className="font-body text-xs text-ink-faint">
                {e.path} · {relative(e.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
