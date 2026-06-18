import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import {
  formatDate,
  formatUsdCents,
  PROJECT_CLASS_TONES,
  PROJECT_VIDEO_TYPE_LABELS,
  projectStatusTone,
} from "@/lib/admin/format";
import type { Project } from "@/types/projects";

export function ProjectsTable({ items }: { items: Project[] }) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-12 text-center font-body text-sm text-ink-muted">
        No projects match these filters.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-white/5 font-body text-xs text-ink-faint">
          <tr>
            <Th>Name</Th>
            <Th>Client</Th>
            <Th>Class</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Timeline</Th>
            <Th className="text-right">Income</Th>
          </tr>
        </thead>
        <tbody className="font-body text-sm">
          {items.map((p) => (
            <tr
              key={p.id}
              className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]"
            >
              <Td>
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-ink hover:text-blue-300"
                >
                  {p.name}
                </Link>
                {p.code && (
                  <span className="ml-2 font-body text-xs text-ink-faint">
                    {p.code}
                  </span>
                )}
                {p.isScammer && (
                  <span
                    title="Marked SCAMMER on Monday"
                    className="ml-2 inline-flex items-center text-rose-400"
                  >
                    <ShieldAlert size={14} strokeWidth={1.75} />
                  </span>
                )}
              </Td>
              <Td className="text-ink-muted">
                {p.clientId ? (
                  <Link
                    href={`/admin/clients/${p.clientId}`}
                    className="text-ink-muted hover:text-blue-300"
                  >
                    {p.clientName ?? "—"}
                  </Link>
                ) : (
                  (p.clientName ?? <span className="text-ink-faint">—</span>)
                )}
              </Td>
              <Td>
                {p.class ? (
                  <Badge tone={PROJECT_CLASS_TONES[p.class]}>{p.class}</Badge>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </Td>
              <Td className="text-ink-muted">
                {p.videoType ? (
                  PROJECT_VIDEO_TYPE_LABELS[p.videoType]
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </Td>
              <Td>
                {p.status ? (
                  <Badge tone={projectStatusTone(p.status)}>{p.status}</Badge>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </Td>
              <Td className="text-ink-muted">
                {p.timelineStart ? (
                  <>
                    {formatDate(p.timelineStart)}
                    {p.timelineEnd && (
                      <>
                        {" "}
                        <span className="text-ink-faint">→</span>{" "}
                        {formatDate(p.timelineEnd)}
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </Td>
              <Td className="text-right text-ink">
                {formatUsdCents(p.financials.paypalIncomeCents)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-2.5 font-medium uppercase tracking-wide ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3 ${className ?? ""}`}>{children}</td>;
}
