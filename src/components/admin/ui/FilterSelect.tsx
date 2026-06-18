"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * URL-driven `<select>`. Same pattern as SearchInput — binds to a
 * specific searchParam and resets `page` on change.
 *
 * Theming caveat: native `<option>` elements ignore most page CSS —
 * Chromium reads `background-color` + `color` inline-styled on each
 * option, but Firefox/Safari fall back to OS colors regardless. So we
 * set inline styles for the Chromium case (avoids white-on-near-white
 * options on the dark admin shell) and accept the OS-default rendering
 * on the other engines (still readable: dark text on light bg).
 */
const OPTION_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-canvas)",
  color: "var(--color-ink)",
};

export function FilterSelect({
  param,
  label,
  options,
  className,
}: {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? "";

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(param, next);
    else params.delete(param);
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <label className={cn("flex items-center gap-2", className)}>
      <span className="font-body text-xs text-ink-faint">{label}</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          "rounded-md border border-white/15 bg-white/[0.03] px-2 py-1.5 font-body text-xs text-ink",
          "transition-colors focus:border-blue-500/60 focus:bg-white/[0.06] focus:outline-none",
        )}
      >
        <option value="" style={OPTION_STYLE}>
          All
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={OPTION_STYLE}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
