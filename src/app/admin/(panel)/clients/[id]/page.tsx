import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { ClientPriceCard } from "@/components/admin/clients/ClientPriceCard";
import { ClientStatsCard } from "@/components/admin/clients/ClientStatsCard";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_TONES,
} from "@/lib/admin/format";
import { getClientsService, getProjectsService } from "@/services/admin";

export const metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientsService = getClientsService();
  const projectsService = getProjectsService();

  const client = await clientsService.getById(id);
  if (!client) notFound();

  // Pull all projects for this client (no pagination — client pages
  // typically have <50 projects each).
  const projectsResult = await projectsService.list({
    clientId: client.id,
    pageSize: 200,
    sortBy: "timeline_start",
    sortDir: "desc",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1 font-body text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Clients
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
            {client.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-sm text-ink-muted">
            <Badge tone={CLIENT_STATUS_TONES[client.status]}>
              {CLIENT_STATUS_LABELS[client.status]}
            </Badge>
            {client.code && <span>· {client.code}</span>}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="hover:text-blue-300"
              >
                · {client.email}
              </a>
            )}
            {client.country && <span>· {client.country}</span>}
          </div>
          {(client.needsFollowup || client.isReconnecting) && (
            <div className="mt-2 flex gap-2">
              {client.needsFollowup && (
                <Badge tone="warning">Needs follow up</Badge>
              )}
              {client.isReconnecting && <Badge tone="info">Reconnecting</Badge>}
            </div>
          )}
        </div>
      </header>

      <ClientStatsCard
        projects={projectsResult.items}
        lastProjectAt={client.lastProjectAt}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ClientPriceCard pricing={client.pricing} />

        <Card>
          <CardHeader title="Workflow" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 py-4 font-body text-sm sm:grid-cols-2">
            <Row label="Team leader" value={client.teamLeader} />
            <Row label="Platform" value={client.platform} />
            <Row label="ETA" value={client.eta} />
            <Row label="Payment schedule" value={client.paymentSchedule} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Projects"
          description={`${projectsResult.total.toLocaleString("en-US")} projects total`}
        />
        <ProjectsTable items={projectsResult.items} />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">
        {value ?? <span className="text-ink-faint">—</span>}
      </span>
    </div>
  );
}
