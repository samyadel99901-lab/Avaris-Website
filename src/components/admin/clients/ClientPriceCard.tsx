import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { formatUsdCents } from "@/lib/admin/format";
import type { ClientPricing } from "@/types/clients";

export function ClientPriceCard({ pricing }: { pricing: ClientPricing }) {
  const standard = [
    { label: "A · less than 1 min", v: pricing.aLess1MinCents },
    { label: "A · more than 1 min", v: pricing.aMore1MinCents },
    { label: "B · less than 1 min", v: pricing.bLess1MinCents },
    { label: "B · more than 1 min", v: pricing.bMore1MinCents },
  ];
  const special = pricing.isSpecialDeal
    ? [
        { label: "A · video (special)", v: pricing.specialAVideoCents },
        { label: "A · reel (special)", v: pricing.specialAReelCents },
        { label: "B · video (special)", v: pricing.specialBVideoCents },
        { label: "B · reel (special)", v: pricing.specialBReelCents },
      ]
    : [];

  return (
    <Card>
      <CardHeader
        title="Pricing"
        description={
          pricing.isSpecialDeal
            ? "Standard rates + special-deal overrides"
            : "Standard rates"
        }
      />
      <CardBody className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {standard.map((row) => (
          <Row key={row.label} label={row.label} value={formatUsdCents(row.v)} />
        ))}
        {pricing.classCText && (
          <Row label="Class C" value={pricing.classCText} />
        )}
        {special.length > 0 && (
          <>
            <hr className="my-1 border-white/5 sm:col-span-2" />
            {special.map((row) => (
              <Row
                key={row.label}
                label={row.label}
                value={formatUsdCents(row.v)}
                accent
              />
            ))}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 font-body text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={accent ? "text-blue-300" : "text-ink"}>{value}</span>
    </div>
  );
}
