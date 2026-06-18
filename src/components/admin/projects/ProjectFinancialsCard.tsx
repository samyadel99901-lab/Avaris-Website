import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { formatEgp, formatUsdCents } from "@/lib/admin/format";
import type { ProjectFinancials } from "@/types/projects";

export function ProjectFinancialsCard({
  financials,
}: {
  financials: ProjectFinancials;
}) {
  // Net only makes sense when we have an income figure to subtract
  // Samy's PayPal from. With null income we can't compute net.
  const usdProfit =
    financials.paypalIncomeCents !== null
      ? financials.paypalIncomeCents - financials.samyPaypalCents
      : null;
  return (
    <Card>
      <CardHeader title="Financials" />
      <CardBody className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <Row label="PayPal income" value={formatUsdCents(financials.paypalIncomeCents)} accent />
        <Row label="Deposit" value={formatUsdCents(financials.depositCents)} />
        <Row label="Samy PayPal" value={formatUsdCents(financials.samyPaypalCents)} />
        <Row label="Editor cost" value={formatEgp(financials.editorCostEgp)} />
        <Row label="Bonus" value={formatEgp(financials.bonusEgp)} />
        <Row label="Net (USD)" value={formatUsdCents(usdProfit)} muted />
      </CardBody>
    </Card>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 font-body text-sm">
      <span className="text-ink-muted">{label}</span>
      <span
        className={
          accent ? "font-medium text-emerald-300" : muted ? "text-ink-faint" : "text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}
