"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlanPanel } from "./plan-panel";
import { TrainingPanel } from "./training-panel";
import { ProgressPanel } from "./progress-panel";
import { TodayCard } from "./today-card";
import type { WorkoutPlan, WorkoutSessionWithSets } from "@/lib/types";
import type { ClientTrainingSnapshot } from "@/lib/data/training-snapshot";

type TabKey = "plan" | "log" | "progress";

export function TrainingArea({
  clientId,
  plans,
  sessions,
  snapshot,
  canUseAi = false,
}: {
  clientId: string;
  plans: WorkoutPlan[];
  sessions: WorkoutSessionWithSets[];
  snapshot?: ClientTrainingSnapshot | null;
  /** Whether the trainer's plan unlocks AI generation. */
  canUseAi?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("progress");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "progress", label: "Progress" },
    { key: "plan", label: "Training plan" },
    { key: "log", label: `Session log${sessions.length ? ` (${sessions.length})` : ""}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <TodayCard clientId={clientId} plans={plans} sessions={sessions} />

      <div className="inline-flex gap-1 rounded-[var(--radius)] border border-border bg-muted/50 p-1 self-start">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "plan" ? (
        <PlanPanel clientId={clientId} plans={plans} snapshot={snapshot} canUseAi={canUseAi} />
      ) : tab === "log" ? (
        <TrainingPanel clientId={clientId} sessions={sessions} />
      ) : (
        <ProgressPanel sessions={sessions} plans={plans} />
      )}
    </div>
  );
}
