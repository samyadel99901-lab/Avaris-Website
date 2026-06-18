"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  month: string;
  value: number;
}

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

/**
 * `format` is a string discriminator instead of a callback so the parent
 * server component can pass it across the RSC boundary (functions can't
 * cross — Next.js rejects them).
 */
type Format = "integer" | "usd" | "raw";

function formatNumber(n: number, format: Format): string {
  if (format === "usd") return usdFmt.format(n);
  if (format === "integer") return integerFmt.format(n);
  return String(n);
}

export function MonthlyLineChart({
  data,
  format = "raw",
  color = "rgb(59 130 246)",
}: {
  data: Point[];
  format?: Format;
  color?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="monthly-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => m.slice(5)}
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            tickFormatter={(v: number) => formatNumber(v, format)}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "rgb(184 184 184)" }}
            itemStyle={{ color: "rgb(147 197 253)" }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return Number.isFinite(n) ? formatNumber(n, format) : String(value);
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#monthly-grad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
