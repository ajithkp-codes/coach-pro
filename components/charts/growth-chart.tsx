"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/theme-provider";

export interface GrowthPoint {
  /** ISO yyyy-mm-01 */
  date: string;
  value: number;
}

function shortMonth(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

/**
 * Cumulative growth line (single series). Mirrors trend-chart.tsx: one axis,
 * theme-aware marks, the brand vermilion line, a soft fill under it.
 */
export function GrowthChart({
  data,
  label,
}: {
  data: GrowthPoint[];
  label: string;
}) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const AXIS = dark ? "#64748b" : "#94a3b8";
  const GRID = dark ? "#1e2836" : "#eef2f6";
  const LINE = dark ? "#ff6a43" : "#f04e28";
  const gradId = `g-${label.replace(/\W/g, "")}`;

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No {label.toLowerCase()} recorded yet.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity={0.22} />
              <stop offset="100%" stopColor={LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortMonth}
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [`${value}`, label]}
            labelFormatter={(l) => shortMonth(String(l))}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${dark ? "#26303f" : "#e2e8f0"}`,
              background: dark ? "#19212f" : "#ffffff",
              color: dark ? "#e6ebf3" : "#0f172a",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            }}
            labelStyle={{ color: dark ? "#93a1b5" : "#64748b" }}
            cursor={{ stroke: AXIS, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={LINE}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={{ r: 2.5, fill: LINE }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
