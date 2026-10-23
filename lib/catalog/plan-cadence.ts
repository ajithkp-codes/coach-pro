/**
 * Plan cadence — how long a weekly plan runs. A plan is authored as ONE weekly
 * structure (its `days`); the cadence says how many weeks that week repeats for,
 * so a trainer can create a one-off week, a monthly block, or a 12-week program
 * without re-authoring every week. `duration_weeks` is the resolved length the
 * app schedules and logs against; `cadence` keeps the preset the trainer picked.
 *
 * Per-week progression (different loads/exercises each week) is intentionally out
 * of scope here — it would make the plan a list of weeks instead of one template.
 */

import type { PlanCadence } from "@/lib/types";

export interface CadencePreset {
  key: PlanCadence;
  label: string;
  /** Resolved length; 0 means "ask for a custom number of weeks". */
  weeks: number;
}

export const CADENCE_PRESETS: CadencePreset[] = [
  { key: "weekly", label: "Weekly — 1 week", weeks: 1 },
  { key: "biweekly", label: "Bi-weekly — 2 weeks", weeks: 2 },
  { key: "monthly", label: "Monthly — 4 weeks", weeks: 4 },
  { key: "2-months", label: "2 months — 8 weeks", weeks: 8 },
  { key: "3-months", label: "3 months — 12 weeks", weeks: 12 },
  { key: "custom", label: "Custom length…", weeks: 0 },
];

export const CADENCE_KEYS = CADENCE_PRESETS.map((p) => p.key) as [PlanCadence, ...PlanCadence[]];

const BY_KEY = new Map(CADENCE_PRESETS.map((p) => [p.key, p]));

/** The weeks a cadence resolves to; for "custom" use the trainer's number. */
export function cadenceWeeks(cadence: PlanCadence, customWeeks = 1): number {
  if (cadence === "custom") return Math.min(52, Math.max(1, Math.round(customWeeks) || 1));
  return BY_KEY.get(cadence)?.weeks ?? 1;
}

/** A short human label, e.g. "Monthly · 4 weeks" or "Custom · 6 weeks". */
export function describeCadence(cadence: PlanCadence, durationWeeks: number): string {
  const preset = BY_KEY.get(cadence);
  const base = preset && cadence !== "custom" ? preset.label.split(" — ")[0] : "Custom";
  const w = `${durationWeeks} week${durationWeeks === 1 ? "" : "s"}`;
  return `${base} · ${w}`;
}
