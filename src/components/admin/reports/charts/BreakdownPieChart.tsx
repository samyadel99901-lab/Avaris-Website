"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Slice {
  label: string;
  value: number;
}

const COLORS = [
  "rgb(59 130 246)",
  "rgb(16 185 129)",
  "rgb(245 158 11)",
  "rgb(244 63 94)",
  "rgb(168 85 247)",
  "rgb(20 184 166)",
  "rgb(236 72 153)",
];

const TOOLTIP_STYLE = {
  background: "rgb(20 24 31)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "white",
} as const;

const integerFmt = new Intl.NumberFormat("en-US");
const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type Format = "integer" | "usd" | "raw";

function formatNumber(n: number, format: Format): string {
  if (format === "usd") return usdFmt.format(n);
  if (format === "integer") return integerFmt.format(n);
  return String(n);
}

export function BreakdownPieChart({
  data,
  format = "raw",
}: {
  data: Slice[];
  format?: Format;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "rgb(184 184 184)" }}
            itemStyle={{ color: "rgb(147 197 253)" }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return Number.isFinite(n) ? formatNumber(n, format) : String(value);
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
