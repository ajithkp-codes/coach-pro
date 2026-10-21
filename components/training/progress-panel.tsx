"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile, Delta } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  computeStats,
  weeklyVolume,
  muscleBalance,
  exercisesWithHistory,
  exerciseStrengthTrend,
  adherence,
} from "@/lib/training-analytics";
import type { WorkoutPlan, WorkoutSessionWithSets } from "@/lib/types";

function kg(n: number): string {
  return `${n.toLocaleString("en-IN")} kg`;
}

export function ProgressPanel({
  sessions,
  plans,
}: {
  sessions: WorkoutSessionWithSets[];
  plans: WorkoutPlan[];
}) {
  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const balance = useMemo(() => muscleBalance(sessions), [sessions]);
  const adh = useMemo(() => adherence(sessions, plans), [sessions, plans]);
  const exercises = useMemo(() => exercisesWithHistory(sessions), [sessions]);

  const [exercise, setExercise] = useState<string>("");
  const selected = exercise || exercises[0]?.name || "";
  const strength = useMemo(
    () => (selected ? exerciseStrengthTrend(sessions, selected) : []),
    [sessions, selected],
  );

  if (sessions.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium">No sessions logged yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Progress charts — volume over time, strength trends and muscle-group balance — appear
            here once this client has logged a workout.
          </p>
        </CardBody>
      </Card>
    );
  }

  const sessionDelta = stats.sessions30 - stats.sessionsPrev30;
  const volumeDelta = stats.volume30 - stats.volumePrev30;
  const topGroup = balance[0]?.sets ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="dumbbell"
          label="Sessions · 30d"
          value={stats.sessions30}
          accent="indigo"
          sub={<Delta value={sessionDelta} good={sessionDelta >= 0} unit="vs prev" />}
        />
        <StatTile
          icon="flame"
          label="Volume · 30d"
          value={kg(stats.volume30)}
          accent="amber"
          sub={<Delta value={volumeDelta} good={volumeDelta >= 0} unit="kg" />}
        />
        <StatTile
          icon="clock"
          label="Avg session"
          value={stats.avgDuration != null ? `${stats.avgDuration} min` : "—"}
          accent="sky"
          sub={`${stats.totalSessions} sessions all-time`}
        />
        <StatTile
          icon="target"
          label="Adherence · 4wk"
          value={adh ? `${Math.min(100, adh.pct)}%` : "—"}
          accent={adh ? (adh.pct >= 80 ? "green" : adh.pct >= 50 ? "amber" : "red") : "indigo"}
          sub={adh ? `${adh.done} of ${adh.planned} planned` : "No active plan"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training volume</CardTitle>
          <span className="text-xs text-muted-foreground">weekly total · last 12 weeks</span>
        </CardHeader>
        <CardBody>
          <TrendChart data={volume} unit="kg" label="Weekly volume" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Strength trend</CardTitle>
          {exercises.length > 0 && (
            <select
              value={selected}
              onChange={(e) => setExercise(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-border bg-card px-2 py-1 text-sm"
            >
              {exercises.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardBody>
          {exercises.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Log the same weighted exercise across at least two sessions to see an estimated-1RM
              trend.
            </p>
          ) : (
            <TrendChart data={strength} unit="kg" label={`${selected} · est. 1RM`} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Muscle-group balance</CardTitle>
          <Badge tone="neutral">working sets · last 30 days</Badge>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {balance.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No sets logged in the last 30 days.</p>
          ) : (
            balance.map((g) => (
              <div key={g.group} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{g.group}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold tabular-nums">{g.sets}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{g.pct}%</span>
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
                  <div
                    className="h-full rounded-[var(--radius-sm)] bg-primary/85 transition-all"
                    style={{ width: `${Math.max(4, (g.sets / topGroup) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-muted-foreground">
        Volume is reps × weight across all sets. Strength uses the Epley estimated 1-rep max. Balance
        counts working sets so bodyweight and cardio work are included; uncatalogued exercises fall
        under “Other.”
      </p>
    </div>
  );
}
