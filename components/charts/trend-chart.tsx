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

export interface TrendPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

const AXIS = "#94a3b8"; // slate-400, recessive
const GRID = "#eef2f6";
const LINE = "#4f46e5"; // primary indigo (single series)

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
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
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
