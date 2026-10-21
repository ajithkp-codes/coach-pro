"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DietPlanPanel } from "./diet-plan-panel";
import { DietLogPanel } from "./diet-log-panel";
import { DietSubmissionsPanel } from "./diet-submissions-panel";
import { LogLinkCard } from "./log-link-card";
import type { DietPlanWithUrl, DietLogWithEntries, DietSubmission } from "@/lib/types";

export function NutritionArea({
  clientId,
  plans,
  logs,
  submissions,
  logToken,
}: {
  clientId: string;
  plans: DietPlanWithUrl[];
  logs: DietLogWithEntries[];
  submissions: DietSubmission[];
  logToken: string | null;
}) {
  const [tab, setTab] = useState<"plan" | "log">(plans.length ? "log" : "plan");
  const activePlan = plans.find((p) => p.is_active) ?? null;

  const tabs: { key: "plan" | "log"; label: string }[] = [
    { key: "plan", label: "Diet plan" },
    { key: "log", label: `Food log${logs.length ? ` (${logs.length})` : ""}` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DietSubmissionsPanel clientId={clientId} submissions={submissions} activePlan={activePlan} />

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
        <DietPlanPanel clientId={clientId} plans={plans} />
      ) : (
        <DietLogPanel clientId={clientId} logs={logs} activePlan={activePlan} />
      )}

      <LogLinkCard clientId={clientId} token={logToken} />
    </div>
  );
}
