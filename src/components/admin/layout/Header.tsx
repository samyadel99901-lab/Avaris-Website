import type { Admin } from "@/types/admin";
import { MobileSidebar } from "./MobileSidebar";
import { UserMenu } from "./UserMenu";

/**
 * Sticky top bar — mobile menu trigger + admin user menu.
 * Search is reserved for Phase 3 once we have data to search across.
 */
export function Header({ admin }: { admin: Admin }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-canvas/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
      </div>
      <UserMenu admin={admin} />
    </header>
  );
}
