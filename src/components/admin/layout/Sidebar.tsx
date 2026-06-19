import Image from "next/image";
import Link from "next/link";
import { SidebarNav } from "./SidebarNav";

/**
 * Desktop fixed sidebar — visible on `lg+`. Mobile uses
 * `MobileSidebar` (Radix Dialog drawer) instead.
 */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-canvas lg:flex">
      <Link
        href="/admin/analytics"
        className="flex items-center gap-2 border-b border-white/10 px-5 py-4"
      >
        <Image
          src="/logo.png"
          alt="AVARIS"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        <div>
          <div className="font-wordmark text-xs uppercase tracking-[0.3em] text-ink">
            AVARIS
          </div>
          <div className="font-body text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Admin
          </div>
        </div>
      </Link>
      <SidebarNav />
    </aside>
  );
}
