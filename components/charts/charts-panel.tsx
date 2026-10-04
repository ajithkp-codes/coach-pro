"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendChart, type TrendPoint } from "./trend-chart";

export interface SeriesOption {
  key: string;
  label: string;
  unit: string | null;
}

export function ChartsPanel({
  metricSeries,
  metricOptions,
  markerSeries,
  markerOptions,
  volumeSeries = [],
}: {
  metricSeries: Record<string, TrendPoint[]>;
  metricOptions: SeriesOption[];
  markerSeries: Record<string, TrendPoint[]>;
  markerOptions: SeriesOption[];
  volumeSeries?: TrendPoint[];
}) {
  const [metricKey, setMetricKey] = useState(metricOptions[0]?.key ?? "");
  const [markerKey, setMarkerKey] = useState(markerOptions[0]?.key ?? "");

  const metric = metricOptions.find((o) => o.key === metricKey);
  const marker = markerOptions.find((o) => o.key === markerKey);

  if (
    metricOptions.length === 0 &&
    markerOptions.length === 0 &&
    volumeSeries.length === 0
  ) {
    return (
      <EmptyState
        title="Nothing to chart yet"
        description="Record body metrics, health markers, or training sessions and trends will appear here."
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Body metric trend</CardTitle>
          {metricOptions.length > 0 && (
            <Select
              className="h-8 w-auto text-sm"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              aria-label="Choose body metric"
            >
              {metricOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </CardHeader>
        <CardBody>
          {metric ? (
            <TrendChart
              data={metricSeries[metric.key] ?? []}
              unit={metric.unit}
              label={metric.label}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No body metrics recorded yet.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health marker trend</CardTitle>
          {markerOptions.length > 0 && (
            <Select
              className="h-8 w-auto text-sm"
              value={markerKey}
              onChange={(e) => setMarkerKey(e.target.value)}
              aria-label="Choose health marker"
            >
              {markerOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </CardHeader>
        <CardBody>
          {marker ? (
            <TrendChart
              data={markerSeries[marker.key] ?? []}
              unit={marker.unit}
              label={marker.label}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No health markers recorded yet.
            </div>
          )}
        </CardBody>
      </Card>

      {volumeSeries.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Training volume</CardTitle>
          </CardHeader>
          <CardBody>
            <TrendChart data={volumeSeries} unit="kg" label="Volume (reps × weight)" />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
