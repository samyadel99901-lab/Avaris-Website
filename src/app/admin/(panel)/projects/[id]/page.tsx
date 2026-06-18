import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/admin/ui/Badge";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { ProjectFinancialsCard } from "@/components/admin/projects/ProjectFinancialsCard";
import { ScammerWarning } from "@/components/admin/projects/ScammerWarning";
import {
  formatDate,
  formatRelative,
  invoiceStatusTone,
  PROJECT_CLASS_TONES,
  PROJECT_VIDEO_TYPE_LABELS,
  projectStatusTone,
} from "@/lib/admin/format";
import { getProjectsService } from "@/services/admin";

export const metadata = { title: "Project" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectsService().getById(id);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 font-body text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={12} /> Projects
        </Link>
      </div>

      {project.isScammer && <ScammerWarning />}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
            {project.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-sm text-ink-muted">
            {project.code && <span>{project.code}</span>}
            {project.clientId && project.clientName ? (
              <>
                <span>·</span>
                <Link
                  href={`/admin/clients/${project.clientId}`}
                  className="hover:text-blue-300"
                >
                  {project.clientName}
                </Link>
              </>
            ) : project.clientName ? (
              <span>· {project.clientName}</span>
            ) : null}
            {project.class && (
              <Badge tone={PROJECT_CLASS_TONES[project.class]}>
                Class {project.class}
              </Badge>
            )}
            {project.videoType && (
              <Badge tone="neutral">
                {PROJECT_VIDEO_TYPE_LABELS[project.videoType]}
              </Badge>
            )}
            {project.status && (
              <Badge tone={projectStatusTone(project.status)}>
                {project.status}
              </Badge>
            )}
          </div>
        </div>

        {(project.footageLink || project.finalVideoLink) && (
          <div className="flex flex-col gap-2 font-body text-sm">
            {project.footageLink && (
              <LinkButton href={project.footageLink}>Footage</LinkButton>
            )}
            {project.finalVideoLink && (
              <LinkButton href={project.finalVideoLink}>Final video</LinkButton>
            )}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProjectFinancialsCard financials={project.financials} />

        <Card>
          <CardHeader title="Timeline & status" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 py-4 font-body text-sm sm:grid-cols-2">
            <Row label="Start" value={formatDate(project.timelineStart)} />
            <Row label="End" value={formatDate(project.timelineEnd)} />
            <Row label="Client ETA" value={project.clientEta} />
            <Row label="Last updated" value={formatRelative(project.mondayUpdatedAt)} />
            <Row
              label="Invoice"
              valueNode={
                project.invoiceStatus ? (
                  <Badge tone={invoiceStatusTone(project.invoiceStatus)}>
                    {project.invoiceStatus}
                  </Badge>
                ) : null
              }
            />
            <Row label="Editor pay" value={project.editorPayStatus} />
            <Row label="Delivery" value={project.deliveryStatus} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 font-body text-xs text-ink transition-colors hover:bg-white/[0.07]"
    >
      {children} <ExternalLink size={12} strokeWidth={1.75} />
    </a>
  );
}

function Row({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string | null;
  valueNode?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">
        {valueNode ?? value ?? <span className="text-ink-faint">—</span>}
      </span>
    </div>
  );
}
