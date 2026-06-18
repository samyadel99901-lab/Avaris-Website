import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      {Icon && (
        <Icon size={32} strokeWidth={1.25} className="text-ink-faint" />
      )}
      <div className="max-w-md">
        <h3 className="font-body text-sm font-semibold text-ink">{title}</h3>
        {description && (
          <p className="mt-1 font-body text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
