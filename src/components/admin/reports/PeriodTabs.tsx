"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReportPeriod } from "@/types/reports";

const TABS: { value: ReportPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export function PeriodTabs({
  param,
  current,
}: {
  param: string;
  current: ReportPeriod;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPeriod = (next: ReportPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "month") params.delete(param);
    else params.set(param, next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="inline-flex rounded-md border border-white/10 bg-white/[0.02] p-0.5">
      {TABS.map((t) => {
        const active = current === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setPeriod(t.value)}
            className={cn(
              "rounded-sm px-3 py-1 font-body text-xs transition-colors",
              active
                ? "bg-white/[0.08] text-ink"
                : "text-ink-muted hover:text-ink",
            )}
            aria-pressed={active}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
