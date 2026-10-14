"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlanPanel } from "./plan-panel";
import { TrainingPanel } from "./training-panel";
import type { WorkoutPlan, WorkoutSessionWithSets } from "@/lib/types";

export function TrainingArea({
  clientId,
  plans,
  sessions,
}: {
  clientId: string;
  plans: WorkoutPlan[];
  sessions: WorkoutSessionWithSets[];
}) {
  const [tab, setTab] = useState<"plan" | "log">("log");

  const tabs: { key: "plan" | "log"; label: string }[] = [
    { key: "plan", label: "Weekly plan" },
    { key: "log", label: `Session log${sessions.length ? ` (${sessions.length})` : ""}` },
  ];

  return (
    <div className="flex flex-col gap-4">
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
        <PlanPanel clientId={clientId} plans={plans} />
      ) : (
        <TrainingPanel clientId={clientId} sessions={sessions} />
      )}
    </div>
  );
}
