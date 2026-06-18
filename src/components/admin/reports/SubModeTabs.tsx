"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS: { value: "count" | "revenue"; label: string }[] = [
  { value: "count", label: "By projects" },
  { value: "revenue", label: "By revenue" },
];

export function SubModeTabs({ current }: { current: "count" | "revenue" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setMode = (next: "count" | "revenue") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "count") params.delete("topMode");
    else params.set("topMode", next);
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
            onClick={() => setMode(t.value)}
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
