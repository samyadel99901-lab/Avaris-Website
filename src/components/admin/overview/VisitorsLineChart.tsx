"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/types/admin";

export function VisitorsLineChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="visitors-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgb(20 24 31)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
              color: "white",
            }}
            labelStyle={{ color: "rgb(184 184 184)" }}
            itemStyle={{ color: "rgb(147 197 253)" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="rgb(59 130 246)"
            strokeWidth={2}
            fill="url(#visitors-grad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
