import type { ScrollDepthDistribution } from "@/types/admin";

export function ScrollDepthChart({ data }: { data: ScrollDepthDistribution[] }) {
  return (
    <ul className="flex flex-col gap-2 px-5 py-4">
      {data.map((s) => (
        <li key={s.sectionId} className="flex flex-col gap-1.5">
          <div className="flex justify-between font-body text-xs">
            <span className="text-ink-muted">{s.label}</span>
            <span className="font-medium text-ink">{s.reachedPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${s.reachedPct}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
