"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { Delta } from "@/components/ui/stat-tile";
import { formatNumber } from "@/lib/format";
import { METRIC_BY_KEY } from "@/lib/catalog/metrics";
import { TrendChart, type TrendPoint } from "./trend-chart";

function TitleWithIcon({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2">
      <span className="text-muted-foreground">
        <Icon name={icon} size={16} />
      </span>
      {children}
    </CardTitle>
  );
}

function SeriesSummary({
  data,
  unit,
  lowerIsBetter,
}: {
  data: TrendPoint[];
  unit?: string | null;
  lowerIsBetter?: boolean;
}) {
  if (data.length === 0) return null;
  const latest = data[data.length - 1].value;
  const change =
    data.length >= 2 ? +(latest - data[0].value).toFixed(2) : null;
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold tracking-tight">
        {formatNumber(latest, unit)}
      </span>
      {change !== null && change !== 0 && (
        <Delta value={change} unit={unit ?? undefined} good={lowerIsBetter ? change < 0 : undefined} />
      )}
      <span className="text-xs text-muted-foreground">
        over {data.length} readings
      </span>
    </div>
  );
}

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
          <TitleWithIcon icon="scale">Body metric trend</TitleWithIcon>
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
            <>
              <SeriesSummary
                data={metricSeries[metric.key] ?? []}
                unit={metric.unit}
                lowerIsBetter={METRIC_BY_KEY[metric.key]?.lowerIsBetter}
              />
              <TrendChart
                data={metricSeries[metric.key] ?? []}
                unit={metric.unit}
                label={metric.label}
              />
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No body metrics recorded yet.
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <TitleWithIcon icon="pulse">Health marker trend</TitleWithIcon>
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
            <>
              <SeriesSummary data={markerSeries[marker.key] ?? []} unit={marker.unit} />
              <TrendChart
                data={markerSeries[marker.key] ?? []}
                unit={marker.unit}
                label={marker.label}
              />
            </>
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
            <TitleWithIcon icon="dumbbell">Training volume</TitleWithIcon>
          </CardHeader>
          <CardBody>
            <SeriesSummary data={volumeSeries} unit="kg" lowerIsBetter={false} />
            <TrendChart data={volumeSeries} unit="kg" label="Volume (reps × weight)" />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
