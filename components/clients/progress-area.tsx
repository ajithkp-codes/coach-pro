"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Segmented } from "@/components/ui/segmented";
import { MetricsPanel } from "@/components/metrics/metrics-panel";
import { MarkersPanel } from "@/components/markers/markers-panel";
import { GoalsPanel } from "@/components/goals/goals-panel";
import type { SeriesOption } from "@/components/charts/charts-panel";
import type { TrendPoint } from "@/components/charts/trend-chart";

// Charts pull in Recharts; load it only when the Charts tab is opened.
const ChartsPanel = dynamic(
  () => import("@/components/charts/charts-panel").then((m) => m.ChartsPanel),
  {
    ssr: false,
    loading: () => <div className="skeleton h-64 rounded-[var(--radius)]" />,
  },
);
import type { BodyMetric, HealthMarker, Goal } from "@/lib/types";
import type { GoalProgress } from "@/lib/data/goals";

type Tab = "body" | "markers" | "goals" | "charts";

export function ProgressArea({
  clientId,
  metrics,
  markers,
  goals,
  progressById,
  charts,
}: {
  clientId: string;
  metrics: BodyMetric[];
  markers: HealthMarker[];
  goals: Goal[];
  progressById: Record<string, GoalProgress>;
  charts: {
    metricSeries: Record<string, TrendPoint[]>;
    metricOptions: SeriesOption[];
    markerSeries: Record<string, TrendPoint[]>;
    markerOptions: SeriesOption[];
    volumeSeries: TrendPoint[];
    exerciseSeries: Record<string, TrendPoint[]>;
    exerciseOptions: SeriesOption[];
  };
}) {
  const [tab, setTab] = useState<Tab>("body");

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "body", label: "Body" },
          { value: "markers", label: "Markers" },
          { value: "goals", label: "Goals" },
          { value: "charts", label: "Charts" },
        ]}
      />

      {tab === "body" && <MetricsPanel clientId={clientId} metrics={metrics} />}
      {tab === "markers" && <MarkersPanel clientId={clientId} markers={markers} />}
      {tab === "goals" && (
        <GoalsPanel clientId={clientId} goals={goals} progressById={progressById} />
      )}
      {tab === "charts" && (
        <ChartsPanel
          metricSeries={charts.metricSeries}
          metricOptions={charts.metricOptions}
          markerSeries={charts.markerSeries}
          markerOptions={charts.markerOptions}
          volumeSeries={charts.volumeSeries}
          exerciseSeries={charts.exerciseSeries}
          exerciseOptions={charts.exerciseOptions}
        />
      )}
    </div>
  );
}
