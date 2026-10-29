/**
 * The "Generate with AI" workout-plan brief — the structured intake a trainer
 * fills (or confirms) before the model drafts a plan. Shared by the client UI
 * (components/training/ai-plan-brief.tsx) and the server action
 * (app/(dashboard)/clients/[id]/training/plan-ai-actions.ts) so the option
 * lists and the shape never drift apart.
 *
 * Nothing here is persisted to the client record — it lives only for the length
 * of one generation (per the product decision), but it is reused when the
 * trainer regenerates with tweaks.
 */

export type Experience = "beginner" | "intermediate" | "advanced";

export interface PlanBrief {
  /** Free-text goal in the trainer's own words. */
  goal: string;
  /** Quick goal tags (chips) — see GOAL_FOCUS_OPTIONS. */
  goalFocus: string[];
  /** Target date / event, yyyy-mm-dd, or "" for none. */
  deadline: string;
  daysPerWeek: number;
  sessionMinutes: number;
  /** What the client can train with — see EQUIPMENT_OPTIONS. */
  equipment: string[];
  experience: Experience;
  /** Coming back after a long break → start conservatively. */
  returning: boolean;
  /** Injury / movement limits to program around — see INJURY_OPTIONS (+ free text). */
  injuries: string[];
  /** Medical conditions to respect — see CONDITION_OPTIONS. */
  conditions: string[];
  /** Exercises / styles the client enjoys (free text). */
  loves: string;
  /** Exercises the client dislikes or can't do (free text). */
  avoids: string;
  /** Preferred training style — see STYLE_OPTIONS. */
  style: string;
  /** Lifestyle notes: job, sleep, stress, daily activity (free text). */
  lifestyle: string;
  /** Training split — see SPLIT_OPTIONS ("auto" = let the model choose). */
  split: string;
  /** Build in week-to-week progression. */
  progression: boolean;
  includeWarmup: boolean;
  includeMobility: boolean;
  includeConditioning: boolean;
  /** Anything else the trainer wants to tell the model (free text). */
  notes: string;
}

export const GOAL_FOCUS_OPTIONS = [
  "Fat loss",
  "Build muscle",
  "Get stronger",
  "Endurance",
  "Mobility & flexibility",
  "General health",
  "Sport-specific",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Full gym",
  "Dumbbells",
  "Barbell",
  "Kettlebells",
  "Resistance bands",
  "Machines",
  "Cardio machines",
  "Bodyweight only",
] as const;

export const SESSION_MINUTES_OPTIONS = [30, 45, 60, 75, 90] as const;

export const EXPERIENCE_OPTIONS: Experience[] = ["beginner", "intermediate", "advanced"];

export const INJURY_OPTIONS = [
  "Lower back",
  "Knee",
  "Shoulder",
  "Neck",
  "Hip",
  "Wrist",
  "Ankle",
  "Elbow",
] as const;

export const CONDITION_OPTIONS = [
  "High blood pressure",
  "Diabetes",
  "Heart condition",
  "Pregnant / postpartum",
  "Asthma",
  "Joint / arthritis",
] as const;

export const STYLE_OPTIONS = [
  "Free weights",
  "Machines",
  "Circuits",
  "Classes",
  "Mixed",
] as const;

export const SPLIT_OPTIONS: { value: string; label: string }[] = [
  { value: "auto", label: "Let AI choose" },
  { value: "full_body", label: "Full body" },
  { value: "upper_lower", label: "Upper / lower" },
  { value: "push_pull_legs", label: "Push / pull / legs" },
  { value: "body_part", label: "Body-part split" },
];

export function defaultBrief(): PlanBrief {
  return {
    goal: "",
    goalFocus: [],
    deadline: "",
    daysPerWeek: 3,
    sessionMinutes: 60,
    equipment: ["Full gym"],
    experience: "intermediate",
    returning: false,
    injuries: [],
    conditions: [],
    loves: "",
    avoids: "",
    style: "",
    lifestyle: "",
    split: "auto",
    progression: true,
    includeWarmup: true,
    includeMobility: false,
    includeConditioning: false,
    notes: "",
  };
}
