"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile, Delta } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  computeStats,
  weeklyVolume,
  weeklySessions,
  weeklyDistance,
  paceTrend,
  muscleBalance,
  exercisesWithHistory,
  exerciseStrengthTrend,
  modalitiesTrained,
  activeMinutes,
  activeDays,
  adherence,
} from "@/lib/training-analytics";
import { getModality, type ModalityDef } from "@/lib/catalog/modalities";
import type { WorkoutPlan, WorkoutSessionWithSets } from "@/lib/types";

function hm(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export function ProgressPanel({
  sessions,
  plans,
}: {
  sessions: WorkoutSessionWithSets[];
  plans: WorkoutPlan[];
}) {
  const stats = useMemo(() => computeStats(sessions), [sessions]);
  const adh = useMemo(() => adherence(sessions, plans), [sessions, plans]);
  const mins30 = useMemo(() => activeMinutes(sessions, 30), [sessions]);
  const days30 = useMemo(() => activeDays(sessions, 30), [sessions]);
  const mods = useMemo(() => modalitiesTrained(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium">No sessions logged yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Progress — training volume, distance, pace, strength trends and balance — appears here
            once this client has logged a workout.
          </p>
        </CardBody>
      </Card>
    );
  }

  const sessionDelta = stats.sessions30 - stats.sessionsPrev30;

  return (
    <div className="flex flex-col gap-6">
      {/* Modality-neutral summary — meaningful for any stream, including hybrid clients. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="pulse"
          label="Sessions · 30d"
          value={stats.sessions30}
          accent="indigo"
          sub={<Delta value={sessionDelta} good={sessionDelta >= 0} unit="vs prev" />}
        />
        <StatTile
          icon="clock"
          label="Active time · 30d"
          value={hm(mins30)}
          accent="amber"
          sub={stats.avgDuration != null ? `${stats.avgDuration} min / session` : "—"}
        />
        <StatTile
          icon="calendar"
          label="Active days · 30d"
          value={days30}
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

      {/* One stacked section per stream this client has trained — so a runner sees a
          running overview, a lifter sees strength, and a hybrid client sees both. */}
      {mods.map((m) => (
        <ModalitySection
          key={m}
          def={getModality(m)}
          sessions={sessions.filter((s) => s.modality === m)}
        />
      ))}

      <p className="text-xs text-muted-foreground">
        Volume is reps × weight. Strength uses the Epley estimated 1-rep max. Distance and pace come
        from logged runs (pace = time ÷ distance). Mix counts working sets / segments so bodyweight
        and cardio are included; uncatalogued movements fall under “Other.”
      </p>
    </div>
  );
}

/** Group-share bars (muscle groups for strength, session types for running, focus otherwise). */
function GroupBalance({
  sessions,
  title,
  badge,
}: {
  sessions: WorkoutSessionWithSets[];
  title: string;
  badge: string;
}) {
  const balance = useMemo(() => muscleBalance(sessions), [sessions]);
  const top = balance[0]?.sets ?? 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge tone="neutral">{badge}</Badge>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {balance.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Nothing logged in the last 30 days.</p>
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
                  style={{ width: `${Math.max(4, (g.sets / top) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

function ModalitySection({
  def,
  sessions,
}: {
  def: ModalityDef;
  sessions: WorkoutSessionWithSets[];
}) {
  const metric = def.primaryMetric;

  // Strength-style selector (only used by the weight branch, declared unconditionally).
  const exercises = useMemo(() => exercisesWithHistory(sessions), [sessions]);
  const [exercise, setExercise] = useState<string>("");
  const selected = exercise || exercises[0]?.name || "";
  const strength = useMemo(
    () => (metric === "weight" && selected ? exerciseStrengthTrend(sessions, selected) : []),
    [metric, sessions, selected],
  );

  const volume = useMemo(() => weeklyVolume(sessions), [sessions]);
  const distance = useMemo(() => weeklyDistance(sessions), [sessions]);
  const pace = useMemo(() => paceTrend(sessions), [sessions]);
  const count = useMemo(() => weeklySessions(sessions), [sessions]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-info-bg text-primary">
          <Icon name={def.icon} size={16} />
        </span>
        <h3 className="text-sm font-semibold">{def.label}</h3>
        <span className="text-xs text-muted-foreground">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </span>
      </div>

      {metric === "weight" && (
        <>
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
                  Log the same weighted exercise across at least two sessions to see an
                  estimated-1RM trend.
                </p>
              ) : (
                <TrendChart data={strength} unit="kg" label={`${selected} · est. 1RM`} />
              )}
            </CardBody>
          </Card>
          <GroupBalance sessions={sessions} title="Muscle-group balance" badge="working sets · 30d" />
        </>
      )}

      {metric === "distance" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly distance</CardTitle>
              <span className="text-xs text-muted-foreground">last 12 weeks</span>
            </CardHeader>
            <CardBody>
              <TrendChart data={distance} unit="km" label="Weekly distance" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pace trend</CardTitle>
              <span className="text-xs text-muted-foreground">avg min / km · lower is faster</span>
            </CardHeader>
            <CardBody>
              {pace.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Log a run with both distance and time to see a pace trend.
                </p>
              ) : (
                <TrendChart data={pace} unit="/km" label="Avg pace" />
              )}
            </CardBody>
          </Card>
          <GroupBalance sessions={sessions} title="Session-type mix" badge="segments · 30d" />
        </>
      )}

      {metric !== "weight" && metric !== "distance" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly sessions</CardTitle>
              <span className="text-xs text-muted-foreground">last 12 weeks</span>
            </CardHeader>
            <CardBody>
              <TrendChart data={count} unit={null} label="Sessions per week" />
            </CardBody>
          </Card>
          <GroupBalance sessions={sessions} title="Session focus" badge="logged work · 30d" />
        </>
      )}
    </section>
  );
}
