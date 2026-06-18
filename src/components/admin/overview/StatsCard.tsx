import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/admin/ui/Card";

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="font-body text-xs font-medium uppercase tracking-wider text-ink-faint">
          {label}
        </div>
        {Icon && <Icon size={16} strokeWidth={1.75} className="text-ink-faint" />}
      </div>
      <div className="mt-3 font-display text-3xl text-ink">{value}</div>
      {hint && <div className="mt-1 font-body text-xs text-ink-muted">{hint}</div>}
    </Card>
  );
}
