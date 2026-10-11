import { listBodyMetrics } from "@/lib/data/bodyMetrics";
import { listHealthMarkers } from "@/lib/data/healthMarkers";
import { listSessions, sessionVolume } from "@/lib/data/training";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { markerLabel } from "@/lib/catalog/markers";
import {
  ChartsPanel,
  type SeriesOption,
} from "@/components/charts/charts-panel";
import type { TrendPoint } from "@/components/charts/trend-chart";

export default async function ChartsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [metrics, markers, sessions] = await Promise.all([
    listBodyMetrics(id),
    listHealthMarkers(id),
    listSessions(id),
  ]);

  // Body-metric series (ascending by date), one per field that has data.
  const asc = [...metrics].sort((a, b) =>
    a.measured_on < b.measured_on ? -1 : 1,
  );
  const metricSeries: Record<string, TrendPoint[]> = {};
  const metricOptions: SeriesOption[] = [];
  for (const f of BODY_METRIC_FIELDS) {
    const points = asc
      .filter((m) => m[f.key as keyof typeof m] != null)
      .map((m) => ({
        date: m.measured_on,
        value: Number(m[f.key as keyof typeof m]),
      }));
    if (points.length > 0) {
      metricSeries[f.key] = points;
      metricOptions.push({ key: f.key, label: f.label, unit: f.unit });
    }
  }

  // Health-marker series grouped by marker (custom markers grouped by name).
  const markersAsc = [...markers].sort((a, b) =>
    a.measured_on < b.measured_on ? -1 : 1,
  );
  const markerSeries: Record<string, TrendPoint[]> = {};
  const markerOptions: SeriesOption[] = [];
  for (const m of markersAsc) {
    const key =
      m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (!markerSeries[key]) {
      markerSeries[key] = [];
      markerOptions.push({
        key,
        label: markerLabel(m.marker_key, m.custom_name),
        unit: m.unit,
      });
    }
    markerSeries[key].push({ date: m.measured_on, value: Number(m.value) });
  }

  // Training volume aggregated per day (Σ reps × weight), ascending.
  const volMap = new Map<string, number>();
  for (const s of sessions) {
    const v = sessionVolume(s);
    if (v > 0) volMap.set(s.performed_on, (volMap.get(s.performed_on) ?? 0) + v);
  }
  const volumeSeries: TrendPoint[] = Array.from(volMap.entries())
    .map(([date, value]) => ({ date, value: Math.round(value) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // Per-exercise progression: top working weight per session date, ascending.
  const sessionsAsc = [...sessions].sort((a, b) =>
    a.performed_on < b.performed_on ? -1 : 1,
  );
  const exerciseSeries: Record<string, TrendPoint[]> = {};
  for (const s of sessionsAsc) {
    const topByExercise = new Map<string, number>();
    for (const set of s.sets) {
      if (set.weight_kg == null) continue;
      const w = Number(set.weight_kg);
      const cur = topByExercise.get(set.exercise_name) ?? 0;
      if (w > cur) topByExercise.set(set.exercise_name, w);
    }
    for (const [name, top] of topByExercise) {
      (exerciseSeries[name] ??= []).push({ date: s.performed_on, value: top });
    }
  }
  const exerciseOptions: SeriesOption[] = Object.keys(exerciseSeries)
    .filter((k) => exerciseSeries[k].length >= 2)
    .sort()
    .map((k) => ({ key: k, label: k, unit: "kg" }));

  return (
    <ChartsPanel
      metricSeries={metricSeries}
      metricOptions={metricOptions}
      markerSeries={markerSeries}
      markerOptions={markerOptions}
      volumeSeries={volumeSeries}
      exerciseSeries={exerciseSeries}
      exerciseOptions={exerciseOptions}
    />
  );
}
