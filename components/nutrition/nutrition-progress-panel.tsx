"use client";

import { useMemo } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile, Delta } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  computeDietStats,
  calorieTrend,
  proteinTrend,
  mealBalance,
  calorieAdherence,
} from "@/lib/nutrition-analytics";
import type { DietLogWithEntries, DietPlan } from "@/lib/types";

export function NutritionProgressPanel({
  logs,
  activePlan,
}: {
  logs: DietLogWithEntries[];
  activePlan: DietPlan | null;
}) {
  const stats = useMemo(() => computeDietStats(logs), [logs]);
  const calories = useMemo(() => calorieTrend(logs), [logs]);
  const protein = useMemo(() => proteinTrend(logs), [logs]);
  const balance = useMemo(() => mealBalance(logs), [logs]);
  const adherence = useMemo(() => calorieAdherence(logs, activePlan), [logs, activePlan]);

  if (logs.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm font-medium">No food logged yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Calorie and protein trends, target adherence and where calories come from appear here
            once this client has logged a day of meals.
          </p>
        </CardBody>
      </Card>
    );
  }

  const daysDelta = stats.daysLogged30 - stats.daysLoggedPrev30;
  const calTarget = activePlan?.target_calories ?? null;
  const proTarget = activePlan?.target_protein_g ?? null;
  const topMeal = balance[0]?.calories ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="calendar"
          label="Days logged · 30d"
          value={stats.daysLogged30}
          accent="indigo"
          sub={<Delta value={daysDelta} good={daysDelta >= 0} unit="vs prev" />}
        />
        <StatTile
          icon="flame"
          label="Avg calories"
          value={stats.avgCalories != null ? `${stats.avgCalories.toLocaleString("en-IN")}` : "—"}
          accent="amber"
          sub={calTarget ? `target ${calTarget.toLocaleString("en-IN")} kcal` : "per logged day"}
        />
        <StatTile
          icon="target"
          label="Avg protein"
          value={stats.avgProtein != null ? `${stats.avgProtein} g` : "—"}
          accent="sky"
          sub={proTarget ? `target ${proTarget} g` : "per logged day"}
        />
        <StatTile
          icon="checkCircle"
          label="On target · 30d"
          value={adherence ? `${adherence.pct}%` : "—"}
          accent={adherence ? (adherence.pct >= 70 ? "green" : adherence.pct >= 40 ? "amber" : "red") : "indigo"}
          sub={adherence ? `${adherence.onTargetDays} of ${adherence.loggedDays} days` : "No calorie target"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calories</CardTitle>
          <span className="text-xs text-muted-foreground">per logged day · last 30 days</span>
        </CardHeader>
        <CardBody>
          <TrendChart data={calories} unit="kcal" label="Calories" target={calTarget} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protein</CardTitle>
          <span className="text-xs text-muted-foreground">per logged day · last 30 days</span>
        </CardHeader>
        <CardBody>
          <TrendChart data={protein} unit="g" label="Protein" target={proTarget} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where calories come from</CardTitle>
          <Badge tone="neutral">by meal · last 30 days</Badge>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {balance.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No calories recorded in the last 30 days.
            </p>
          ) : (
            balance.map((m) => (
              <div key={m.meal} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{m.meal}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {m.calories.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{m.pct}%</span>
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
                  <div
                    className="h-full rounded-[var(--radius-sm)] bg-primary/85 transition-all"
                    style={{ width: `${Math.max(4, (m.calories / topMeal) * 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-muted-foreground">
        Averages count only days with calories logged. “On target” is the share of logged days whose
        calories land within ±10% of the plan target. Numbers are as logged — approximate where the
        client estimated portions.
      </p>
    </div>
  );
}
