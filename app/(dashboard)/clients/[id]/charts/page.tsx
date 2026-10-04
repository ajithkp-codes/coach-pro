import { listBodyMetrics } from "@/lib/data/bodyMetrics";
import { listHealthMarkers } from "@/lib/data/healthMarkers";
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
  const [metrics, markers] = await Promise.all([
    listBodyMetrics(id),
    listHealthMarkers(id),
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

  return (
    <ChartsPanel
      metricSeries={metricSeries}
      metricOptions={metricOptions}
      markerSeries={markerSeries}
      markerOptions={markerOptions}
    />
  );
}
