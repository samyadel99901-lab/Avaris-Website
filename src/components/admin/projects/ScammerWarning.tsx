import { ShieldAlert } from "lucide-react";

export function ScammerWarning() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-5 py-4">
      <ShieldAlert
        size={18}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0 text-rose-400"
      />
      <div className="font-body">
        <p className="text-sm font-semibold text-rose-300">
          Marked as scammer on Monday
        </p>
        <p className="mt-0.5 text-xs text-rose-200/80">
          This project was flagged. Don't continue work or accept payment from
          this client until the flag is reviewed.
        </p>
      </div>
    </div>
  );
}
