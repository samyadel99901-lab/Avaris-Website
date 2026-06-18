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
import type { VideoMetrics } from "@/types/admin";

export function TopVideosBarChart({ data }: { data: VideoMetrics[] }) {
  const top = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="videoLabel"
            tick={{ fill: "rgb(184 184 184)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            width={130}
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
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="views" radius={[0, 4, 4, 0]}>
            {top.map((_, i) => (
              <Cell key={i} fill="rgb(59 130 246)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
