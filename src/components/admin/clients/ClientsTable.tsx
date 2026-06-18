import Link from "next/link";
import { Badge } from "@/components/admin/ui/Badge";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_TONES,
  formatRelative,
} from "@/lib/admin/format";
import type { Client } from "@/types/clients";

export function ClientsTable({ items }: { items: Client[] }) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-12 text-center font-body text-sm text-ink-muted">
        No clients match these filters.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-white/5 font-body text-xs text-ink-faint">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Country</Th>
            <Th>Status</Th>
            <Th className="text-right">Last project</Th>
          </tr>
        </thead>
        <tbody className="font-body text-sm">
          {items.map((c) => (
            <tr
              key={c.id}
              className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.02]"
            >
              <Td>
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="text-ink hover:text-blue-300"
                >
                  {c.name}
                </Link>
                {c.code && (
                  <span className="ml-2 font-body text-xs text-ink-faint">
                    {c.code}
                  </span>
                )}
              </Td>
              <Td className="text-ink-muted">
                {c.email ?? <span className="text-ink-faint">—</span>}
              </Td>
              <Td className="text-ink-muted">
                {c.country ?? <span className="text-ink-faint">—</span>}
              </Td>
              <Td>
                <Badge tone={CLIENT_STATUS_TONES[c.status]}>
                  {CLIENT_STATUS_LABELS[c.status]}
                </Badge>
                {c.pricing.isSpecialDeal && (
                  <Badge tone="info" className="ml-1">
                    Special
                  </Badge>
                )}
              </Td>
              <Td className="text-right text-ink-muted">
                {formatRelative(c.lastProjectAt)}
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
