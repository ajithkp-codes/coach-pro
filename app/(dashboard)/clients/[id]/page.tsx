import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getClient } from "@/lib/data/clients";
import { listBodyMetrics } from "@/lib/data/bodyMetrics";
import { listHealthMarkers } from "@/lib/data/healthMarkers";
import { listGoals, computeGoalProgress } from "@/lib/data/goals";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { markerLabel } from "@/lib/catalog/markers";
import { formatDate, formatNumber } from "@/lib/format";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import type { HealthMarker } from "@/lib/types";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [metrics, markers, goals] = await Promise.all([
    listBodyMetrics(id),
    listHealthMarkers(id),
    listGoals(id),
  ]);

  const latestMetric = metrics[0];
  const latestByMarker = latestPerMarker(markers);
  const activeGoals = goals.filter((g) => g.status === "active");
  const goalProgress = await Promise.all(
    activeGoals.slice(0, 4).map(async (g) => ({
      goal: g,
      progress: await computeGoalProgress(g),
    })),
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Latest measurements</CardTitle>
          {latestMetric && (
            <span className="text-xs text-muted-foreground">
              {formatDate(latestMetric.measured_on)}
            </span>
          )}
        </CardHeader>
        <CardBody>
          {latestMetric ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {BODY_METRIC_FIELDS.map((f) => {
                const v = latestMetric[f.key as keyof typeof latestMetric];
                if (v === null || v === undefined) return null;
                return (
                  <div key={f.key}>
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm font-medium">
                      {formatNumber(Number(v), f.unit)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <EmptyHint
              text="No body metrics recorded yet."
              href={`/clients/${id}/metrics`}
              cta="Add metrics"
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest health markers</CardTitle>
        </CardHeader>
        <CardBody>
          {latestByMarker.length ? (
            <ul className="flex flex-col gap-2.5">
              {latestByMarker.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    {markerLabel(m.marker_key, m.custom_name)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatNumber(m.value, m.unit)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDate(m.measured_on)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint
              text="No health markers recorded yet."
              href={`/clients/${id}/markers`}
              cta="Add markers"
            />
          )}
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Active goals</CardTitle>
          <Badge tone="info">{activeGoals.length} active</Badge>
        </CardHeader>
        <CardBody>
          {goalProgress.length ? (
            <ul className="flex flex-col gap-4">
              {goalProgress.map(({ goal, progress }) => (
                <li key={goal.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {goal.target_value !== null
                        ? `Target ${formatNumber(goal.target_value, goal.target_unit)}`
                        : goal.category}
                    </span>
                  </div>
                  <GoalProgressBar progress={progress} goal={goal} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint
              text="No active goals."
              href={`/clients/${id}/goals`}
              cta="Set a goal"
            />
          )}
        </CardBody>
      </Card>

      {client.notes && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {client.notes}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function latestPerMarker(markers: HealthMarker[]): HealthMarker[] {
  const seen = new Map<string, HealthMarker>();
  for (const m of markers) {
    // markers arrive sorted by measured_on desc, so first seen is latest
    const key = m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (!seen.has(key)) seen.set(key, m);
  }
  return Array.from(seen.values());
}

function EmptyHint({
  text,
  href,
  cta,
}: {
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      <ButtonLink href={href} variant="outline" size="sm">
        {cta}
      </ButtonLink>
    </div>
  );
}
