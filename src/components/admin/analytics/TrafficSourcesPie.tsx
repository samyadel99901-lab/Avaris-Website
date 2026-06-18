"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TrafficSource } from "@/types/admin";

const COLORS = [
  "rgb(59 130 246)",   // blue
  "rgb(16 185 129)",   // emerald
  "rgb(245 158 11)",   // amber
  "rgb(244 63 94)",    // rose
  "rgb(168 85 247)",   // purple
];

export function TrafficSourcesPie({ data }: { data: TrafficSource[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="visits"
            nameKey="source"
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
