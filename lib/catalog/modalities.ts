/**
 * Modality registry — the single source of truth for how each kind of personal
 * training is planned, logged and measured. The plan editor and workout logger
 * render GENERICALLY from these definitions instead of hard-coding strength's
 * sets × reps × weight, so a new stream is one entry here, not a forked UI.
 *
 * Fields map onto the training schema (0002 + 0015):
 *   - plan items are free-text (lib/types.ts PlanItem) — `planColumns` pick which
 *     of its fields a modality shows and how they're labelled.
 *   - logged sets persist to real columns where one exists (weight_kg, reps, rpe,
 *     duration_sec, distance_m) and to the `metrics` jsonb otherwise — `logFields`
 *     declares each field's label, unit, input type and storage target.
 *
 * Adding a modality: append to MODALITIES and extend the Modality union. Nothing
 * else is required for the editor/logger to support it.
 */

import type { IconName } from "@/components/ui/icon";

export type Modality =
  | "strength"
  | "calisthenics"
  | "mobility"
  | "conditioning"
  | "longevity"
  | "lifestyle"
  | "running";

export const DEFAULT_MODALITY: Modality = "strength";

/** The free-text PlanItem fields a modality's editor exposes, in column order. */
export type PlanField =
  | "sets"
  | "reps"
  | "weight"
  | "duration"
  | "distance"
  | "rounds"
  | "tempo"
  | "intensity";

export interface PlanColumn {
  field: PlanField;
  label: string;
  placeholder: string;
  /** Tailwind width for the editor cell; omit for the flexible first columns. */
  width?: string;
}

/** Where a logged value is stored: a real set column, or a key in `metrics` jsonb. */
export type SetColumn = "reps" | "weight_kg" | "rpe" | "duration_sec" | "distance_m";

export type LogFieldKey =
  | "weight"
  | "reps"
  | "rpe"
  | "duration"
  | "distance"
  | "rounds"
  | "calories"
  | "heart_rate"
  | "tempo"
  | "side"
  | "level";

export interface LogField {
  key: LogFieldKey;
  label: string;
  unit?: string;
  input: "number" | "text" | "select";
  options?: string[];
  /** Target column; when omitted the value persists to metrics[key]. */
  column?: SetColumn;
  /** Short explanation surfaced as a tooltip beside the field label. */
  hint?: string;
}

/** 1–10 effort scale used by the RPE / Effort field. */
const RPE_SCALE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const RPE_HINT =
  "Rate of Perceived Exertion — how hard the set felt, from 1 (very easy) to 10 (maximal effort, no reps left in the tank).";

/** What progress/PR tracking is keyed on for this modality. */
export type PrimaryMetric = "weight" | "reps" | "duration" | "distance";

export interface ModalityDef {
  key: Modality;
  label: string;
  /** Short chip label for pickers. */
  short: string;
  description: string;
  icon: IconName;
  /** What one row in a plan/session is called ("Exercise", "Pose", "Drill"…). */
  itemNoun: string;
  planColumns: PlanColumn[];
  logFields: LogField[];
  primaryMetric: PrimaryMetric;
  /** True once the stream's editor/logger/templates are wired. Gates the picker. */
  ready: boolean;
}

// ---- Shared column/field builders (keep labels consistent across modalities) ----
const C = {
  sets: (): PlanColumn => ({ field: "sets", label: "Sets", placeholder: "3", width: "w-16" }),
  reps: (ph = "8-12"): PlanColumn => ({ field: "reps", label: "Reps", placeholder: ph, width: "w-20" }),
  weight: (label = "Weight", ph = "60kg / RPE 8"): PlanColumn => ({ field: "weight", label, placeholder: ph, width: "w-28" }),
  duration: (label = "Hold", ph = "30s"): PlanColumn => ({ field: "duration", label, placeholder: ph, width: "w-20" }),
  distance: (label = "Distance", ph = "400m"): PlanColumn => ({ field: "distance", label, placeholder: ph, width: "w-24" }),
  rounds: (ph = "5"): PlanColumn => ({ field: "rounds", label: "Rounds", placeholder: ph, width: "w-16" }),
  tempo: (ph = "3-1-3"): PlanColumn => ({ field: "tempo", label: "Tempo", placeholder: ph, width: "w-20" }),
  intensity: (label = "Intensity", ph = "RPE 7"): PlanColumn => ({ field: "intensity", label, placeholder: ph, width: "w-24" }),
};

const F = {
  weight: (label = "Weight", unit = "kg"): LogField => ({ key: "weight", label, unit, input: "number", column: "weight_kg" }),
  reps: (label = "Reps"): LogField => ({ key: "reps", label, input: "number", column: "reps" }),
  rpe: (label = "RPE"): LogField => ({ key: "rpe", label, input: "select", options: RPE_SCALE, column: "rpe", hint: RPE_HINT }),
  duration: (label = "Hold", unit = "s"): LogField => ({ key: "duration", label, unit, input: "number", column: "duration_sec" }),
  distance: (label = "Distance", unit = "m"): LogField => ({ key: "distance", label, unit, input: "number", column: "distance_m" }),
  rounds: (): LogField => ({ key: "rounds", label: "Rounds", input: "number" }),
  calories: (): LogField => ({ key: "calories", label: "Calories", unit: "kcal", input: "number" }),
  heartRate: (): LogField => ({ key: "heart_rate", label: "Avg HR", unit: "bpm", input: "number" }),
  tempo: (): LogField => ({ key: "tempo", label: "Tempo", input: "text" }),
  side: (): LogField => ({ key: "side", label: "Side", input: "select", options: ["Both", "Left", "Right"] }),
  level: (): LogField => ({ key: "level", label: "Progression", input: "text" }),
};

export const MODALITIES: ModalityDef[] = [
  {
    key: "strength",
    label: "Strength & resistance",
    short: "Strength",
    description: "Barbell, dumbbell and machine work — sets, reps and load.",
    icon: "dumbbell",
    itemNoun: "Exercise",
    planColumns: [C.sets(), C.reps(), C.weight()],
    logFields: [F.weight(), F.reps(), F.rpe()],
    primaryMetric: "weight",
    ready: true, // the existing, current behaviour
  },
  {
    key: "calisthenics",
    label: "Calisthenics & bodyweight",
    short: "Calisthenics",
    description: "Bodyweight skill progressions — reps, holds, added or assisted load, tempo.",
    icon: "target",
    itemNoun: "Skill",
    planColumns: [C.sets(), C.reps("5-8"), C.duration("Hold"), C.weight("Added / assist", "+10kg / band"), C.tempo()],
    logFields: [F.reps(), F.duration("Hold", "s"), F.weight("Added / assist", "kg"), F.rpe(), F.tempo(), F.level()],
    primaryMetric: "reps",
    ready: true, // Phase 1 — first stream built on the engine
  },
  {
    key: "mobility",
    label: "Yoga, Pilates & mobility",
    short: "Mind-body",
    description: "Poses, flows and mobility drills — hold duration, reps, side and breath.",
    icon: "sparkles",
    itemNoun: "Pose",
    planColumns: [C.duration("Hold / breaths", "5 breaths"), C.reps("per side"), C.intensity("Focus", "depth / breath")],
    logFields: [F.duration("Hold", "s"), F.reps(), F.side(), F.rpe("Effort")],
    primaryMetric: "duration",
    ready: true,
  },
  {
    key: "conditioning",
    label: "Functional, HIIT & conditioning",
    short: "Conditioning",
    description: "Circuits and intervals — rounds, work time, distance, calories and heart rate.",
    icon: "flame",
    itemNoun: "Movement",
    planColumns: [C.rounds(), C.reps("12"), C.duration("Work", "40s"), C.distance(), C.intensity("Rest", "20s")],
    logFields: [F.rounds(), F.duration("Time", "s"), F.distance(), F.reps(), F.calories(), F.heartRate(), F.rpe()],
    primaryMetric: "duration",
    ready: true,
  },
  {
    key: "longevity",
    label: "Longevity & healthy-aging",
    short: "Longevity",
    description: "Adapted training for older adults and corrective work — gentle load, holds, balance, side.",
    icon: "pulse",
    itemNoun: "Exercise",
    planColumns: [C.sets(), C.reps("10-12"), C.duration("Hold", "20s"), C.weight("Load", "light / band"), C.intensity("Effort", "easy")],
    logFields: [F.reps(), F.duration("Hold", "s"), F.weight("Load", "kg"), F.side(), F.rpe("Effort")],
    primaryMetric: "reps",
    ready: true,
  },
  {
    key: "lifestyle",
    label: "Lifestyle, activity & habits",
    short: "Lifestyle",
    description: "Weight-management coaching — daily movement targets, steps and habit checks. Pairs with the nutrition tab.",
    icon: "scale",
    itemNoun: "Activity",
    planColumns: [C.duration("Minutes", "30 min"), C.distance("Steps / distance", "8,000 steps"), C.intensity("Target", "daily")],
    logFields: [F.duration("Minutes", "min"), F.distance("Steps / distance", ""), F.rpe("Effort")],
    primaryMetric: "duration",
    ready: true,
  },
  {
    key: "running",
    label: "Running & endurance",
    short: "Running",
    description: "Road, track and trail running — easy, long, tempo, interval and hill sessions, programmed by distance, time, pace and recovery.",
    icon: "running",
    itemNoun: "Segment",
    // A running day is a sequence of steps (warm-up → main set → cool-down). Every
    // field is optional free text so the trainer prescribes by their own strategy:
    // volume is EITHER distance OR time (one field — never both, they're redundant),
    // and intensity is ONE target (pace, effort or HR zone). Reps + recovery cover
    // interval sets. See lib/catalog/movements/running.ts and lib/catalog/focus.ts.
    planColumns: [
      C.reps("6"),
      { field: "distance", label: "Distance / Time", placeholder: "8 km · 40 min", width: "w-28" },
      { field: "intensity", label: "Target", placeholder: "pace / effort / zone", width: "w-32" },
      { field: "tempo", label: "Recovery", placeholder: "90s jog", width: "w-24" },
    ],
    // Distance is logged in KM and time in MINUTES (not the columns' canonical
    // m/s) — self-consistent within a running session and surfaced with the right
    // unit via each field's `unit`. No cross-modality feature reads these raw.
    logFields: [
      F.distance("Distance", "km"),
      F.duration("Time", "min"),
      { key: "tempo", label: "Avg pace (/km)", input: "text" },
      F.heartRate(),
      F.rpe("Effort"),
    ],
    primaryMetric: "distance",
    ready: true,
  },
];

const BY_KEY = new Map<string, ModalityDef>(MODALITIES.map((m) => [m.key, m]));

/** Resolve a (possibly unknown/legacy) modality string to its definition. */
export function getModality(key: string | null | undefined): ModalityDef {
  return (key && BY_KEY.get(key)) || BY_KEY.get(DEFAULT_MODALITY)!;
}

/** Modalities a trainer can currently pick in the UI (wired end-to-end). */
export function readyModalities(): ModalityDef[] {
  return MODALITIES.filter((m) => m.ready);
}
