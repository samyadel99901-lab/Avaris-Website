"use client";

import { Activity, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

// Monday-sourced sections (Reports / Clients / Projects / Automation) moved
// out to automation-standalone/, and Overview was merged into Analytics. This
// deployed dashboard keeps only the site's own visitor analytics.
export const NAV_ITEMS: NavItem[] = [
  { href: "/admin/analytics", label: "Analytics", icon: Activity },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-white/[0.06] text-ink"
                : "text-ink-muted hover:bg-white/[0.03] hover:text-ink",
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
