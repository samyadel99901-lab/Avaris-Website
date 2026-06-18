import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Badge } from "@/components/admin/ui/Badge";
import { SyncStatusCard } from "@/components/admin/sync/SyncStatusCard";
import { getServerSession } from "@/lib/admin/session";
import { getAuthService } from "@/services/admin";
import { getLastSyncRun } from "@/services/monday/sync/runner";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");

  const admin = await getAuthService().getAdmin(session.adminId);
  if (!admin) redirect("/admin/login");

  // Sync status — best-effort: don't break the page if Supabase isn't
  // configured (mock mode).
  let lastRun = null;
  try {
    lastRun = await getLastSyncRun();
  } catch {
    /* no Supabase configured — show empty state */
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Settings
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Phase 2a admin profile is read-only — credentials live in
          environment variables.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Profile"
          description="From environment configuration"
        />
        <dl className="divide-y divide-white/5 font-body text-sm">
          <Row label="Name" value={admin.name} />
          <Row label="Email" value={admin.email} />
          <Row
            label="Role"
            value={
              <Badge tone={admin.role === "super_admin" ? "info" : "neutral"}>
                {admin.role}
              </Badge>
            }
          />
          <Row
            label="Admin ID"
            value={
              <code className="text-xs text-ink-muted">{admin.id}</code>
            }
          />
          <Row
            label="Session expires"
            value={new Date(session.expiresAt).toLocaleString()}
          />
        </dl>
      </Card>

      <SyncStatusCard
        initialLastRun={lastRun}
        isSuperAdmin={admin.role === "super_admin"}
      />

      <Card>
        <CardHeader title="Coming next" description="Phase 2b" />
        <ul className="px-5 py-4 font-body text-sm text-ink-muted">
          <li>• Swap hardcoded credentials for Clerk or Supabase Auth</li>
          <li>• Multi-admin invite flow</li>
          <li>• Theme + density preferences</li>
          <li>• Activity log per admin</li>
        </ul>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="font-body text-xs uppercase tracking-wider text-ink-faint">
        {label}
      </dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
