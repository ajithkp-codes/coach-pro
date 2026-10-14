"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/theme-provider";

export interface TrendPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function TrendChart({
  data,
  unit,
  label,
}: {
  data: TrendPoint[];
  unit?: string | null;
  label: string;
}) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const AXIS = dark ? "#64748b" : "#94a3b8";
  const GRID = dark ? "#1e2836" : "#eef2f6";
  const LINE = dark ? "#818cf8" : "#4f46e5";

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No data recorded for {label} yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 12, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value) => [`${value}${unit ? ` ${unit}` : ""}`, label]}
            labelFormatter={(l) => shortDate(String(l))}
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
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={LINE}
            strokeWidth={2}
            dot={{ r: 3, fill: LINE }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
