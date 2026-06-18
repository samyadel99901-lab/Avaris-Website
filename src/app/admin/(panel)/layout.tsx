import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { getServerSession } from "@/lib/admin/session";
import { getAuthService } from "@/services/admin";

/**
 * Protected layout for the admin panel. Lives inside the `(panel)` route
 * group so the public `/admin/login` page (outside the group) doesn't
 * inherit this auth check.
 *
 * proxy.ts already redirects unauthenticated requests to /admin/login,
 * but we double-check here so a stale/forged cookie that survives the
 * proxy's verifySession can't reach a Server Component that assumes a
 * session exists.
 */
export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");

  const admin = await getAuthService().getAdmin(session.adminId);
  if (!admin) redirect("/admin/login");

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
