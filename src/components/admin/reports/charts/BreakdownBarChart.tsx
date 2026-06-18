"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  label: string;
  value: number;
}

const TOOLTIP_STYLE = {
  background: "rgb(20 24 31)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "white",
} as const;

const COLORS = [
  "rgb(59 130 246)",
  "rgb(16 185 129)",
  "rgb(245 158 11)",
  "rgb(244 63 94)",
  "rgb(168 85 247)",
  "rgb(20 184 166)",
];

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

export function BreakdownBarChart({
  data,
  format = "raw",
}: {
  data: Point[];
  format?: Format;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            tickFormatter={(v: number) => formatNumber(v, format)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "rgb(184 184 184)" }}
            itemStyle={{ color: "rgb(147 197 253)" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return Number.isFinite(n) ? formatNumber(n, format) : String(value);
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
