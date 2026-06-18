"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Admin } from "@/types/admin";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";
}

export function UserMenu({ admin }: { admin: Admin }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label="Open user menu"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500/15 text-xs font-semibold text-blue-200">
            {initials(admin.name)}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-body text-sm text-ink">{admin.name}</span>
            <span className="font-body text-[11px] text-ink-faint">
              {admin.email}
            </span>
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-md border border-white/10 bg-elevated p-1 shadow-xl shadow-black/40"
        >
          <div className="px-3 py-2 sm:hidden">
            <div className="font-body text-sm text-ink">{admin.name}</div>
            <div className="font-body text-xs text-ink-faint">
              {admin.email}
            </div>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10 sm:hidden" />
          <DropdownMenu.Item asChild>
            <Link
              href="/admin/settings"
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink-muted outline-none transition-colors data-[highlighted]:bg-white/[0.05] data-[highlighted]:text-ink"
            >
              <SettingsIcon size={14} strokeWidth={1.75} />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item asChild>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-rose-300 outline-none transition-colors data-[highlighted]:bg-rose-500/10 data-[highlighted]:text-rose-200 disabled:opacity-50"
            >
              <LogOut size={14} strokeWidth={1.75} />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
