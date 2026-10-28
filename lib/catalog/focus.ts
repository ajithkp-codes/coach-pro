/**
 * Focus areas — the "what are we training today" taxonomy, per modality. Each day
 * of a plan picks a focus (Push, Legs, Vinyasa flow, HIIT…); the editor offers it
 * as a dropdown-with-custom-typing, and the movement-library picker filters to the
 * focus's groups so a trainer only sees the exercises that belong to that focus.
 *
 * `groups` reference the movement group names in lib/catalog/movements/<modality>.ts
 * — a composite focus (e.g. strength "Push") spans several groups; a single-group
 * focus mirrors one; "Rest day" prescribes nothing. Trainers may also type a focus
 * that isn't listed (it just carries no library filter).
 */

import type { Modality } from "./modalities";

export interface FocusArea {
  label: string;
  /** Movement groups this focus pulls from; empty = a rest/recovery day. */
  groups: string[];
}

const REST: FocusArea = { label: "Rest day", groups: [] };

const FOCUS: Record<Modality, FocusArea[]> = {
  strength: [
    { label: "Full body", groups: ["Full body", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"] },
    { label: "Upper body", groups: ["Chest", "Back", "Shoulders", "Arms"] },
    { label: "Lower body", groups: ["Legs", "Core"] },
    { label: "Push", groups: ["Chest", "Shoulders", "Arms"] },
    { label: "Pull", groups: ["Back", "Arms"] },
    { label: "Chest", groups: ["Chest"] },
    { label: "Back", groups: ["Back"] },
    { label: "Shoulders", groups: ["Shoulders"] },
    { label: "Legs", groups: ["Legs"] },
    { label: "Arms", groups: ["Arms"] },
    { label: "Core", groups: ["Core"] },
    { label: "Cardio", groups: ["Cardio"] },
    REST,
  ],
  calisthenics: [
    { label: "Full body", groups: ["Push", "Pull", "Legs", "Core"] },
    { label: "Push", groups: ["Push"] },
    { label: "Pull", groups: ["Pull"] },
    { label: "Legs", groups: ["Legs"] },
    { label: "Core", groups: ["Core"] },
    { label: "Skills & holds", groups: ["Skills & holds"] },
    { label: "Mobility & prep", groups: ["Mobility & prep"] },
    REST,
  ],
  mobility: [
    {
      label: "Full practice",
      groups: ["Standing poses", "Balancing poses", "Sun salutation flow", "Seated & forward folds", "Backbends", "Twists", "Hip openers", "Inversions & arm balances", "Pilates core", "Mobility drills", "Restorative & breath"],
    },
    { label: "Vinyasa flow", groups: ["Sun salutation flow", "Standing poses", "Balancing poses"] },
    { label: "Hip opening", groups: ["Hip openers", "Seated & forward folds"] },
    { label: "Backbends", groups: ["Backbends"] },
    { label: "Twists", groups: ["Twists"] },
    { label: "Balance", groups: ["Balancing poses"] },
    { label: "Inversions & arm balances", groups: ["Inversions & arm balances"] },
    { label: "Pilates core", groups: ["Pilates core"] },
    { label: "Mobility drills", groups: ["Mobility drills"] },
    { label: "Restorative", groups: ["Restorative & breath"] },
    REST,
  ],
  conditioning: [
    {
      label: "Full-body circuit",
      groups: ["Machines & ergometers", "Running & carries", "Plyometrics", "Ballistic & kettlebell", "Functional strength", "Core & midline", "Agility & footwork", "Benchmark pieces"],
    },
    { label: "Cardio & ergometers", groups: ["Machines & ergometers", "Running & carries"] },
    { label: "HIIT / plyometrics", groups: ["Plyometrics", "Ballistic & kettlebell"] },
    { label: "Functional strength", groups: ["Functional strength"] },
    { label: "Core & midline", groups: ["Core & midline"] },
    { label: "Agility & footwork", groups: ["Agility & footwork"] },
    { label: "Benchmark WOD", groups: ["Benchmark pieces"] },
    REST,
  ],
  longevity: [
    {
      label: "Full session",
      groups: ["Balance & stability", "Sit-to-stand & lower body", "Upper body & pulling", "Core & posture", "Mobility & flexibility", "Gait & walking", "Corrective & rehab"],
    },
    { label: "Balance & stability", groups: ["Balance & stability"] },
    { label: "Lower body", groups: ["Sit-to-stand & lower body"] },
    { label: "Upper body", groups: ["Upper body & pulling"] },
    { label: "Core & posture", groups: ["Core & posture"] },
    { label: "Mobility & flexibility", groups: ["Mobility & flexibility"] },
    { label: "Gait & walking", groups: ["Gait & walking"] },
    { label: "Corrective & rehab", groups: ["Corrective & rehab"] },
    REST,
  ],
  lifestyle: [
    { label: "Active day", groups: ["Daily movement", "Cardio & intervals"] },
    { label: "Daily movement", groups: ["Daily movement"] },
    { label: "Cardio & intervals", groups: ["Cardio & intervals"] },
    { label: "Light strength", groups: ["Light strength"] },
    { label: "Mobility breaks", groups: ["Mobility breaks"] },
    { label: "Habit targets", groups: ["Habit targets"] },
    REST,
  ],
  running: [
    { label: "Easy / base", groups: ["Easy & recovery", "Warm-up & cool-down"] },
    { label: "Long run", groups: ["Long runs", "Warm-up & cool-down"] },
    { label: "Tempo / threshold", groups: ["Tempo & threshold", "Warm-up & cool-down", "Drills & technique"] },
    { label: "Intervals / VO2max", groups: ["Intervals & VO2max", "Speed & strides", "Warm-up & cool-down", "Drills & technique"] },
    { label: "Hills", groups: ["Hills & strength", "Warm-up & cool-down"] },
    { label: "Speed & strides", groups: ["Speed & strides", "Drills & technique"] },
    { label: "Technique & drills", groups: ["Drills & technique", "Warm-up & cool-down"] },
    { label: "Recovery run", groups: ["Easy & recovery"] },
    { label: "Race / time trial", groups: ["Race & time trial", "Warm-up & cool-down"] },
    REST,
  ],
};

/** The preset focus options for a modality (the dropdown list). */
export function focusAreasForModality(modality: Modality): FocusArea[] {
  return FOCUS[modality] ?? [];
}

/** The movement groups a focus label maps to, or [] for a custom/unknown/rest focus. */
export function groupsForFocus(modality: Modality, label: string): string[] {
  const norm = label.trim().toLowerCase();
  if (!norm) return [];
  const hit = (FOCUS[modality] ?? []).find((f) => f.label.toLowerCase() === norm);
  return hit ? hit.groups : [];
}

/** Whether a focus label is the rest/recovery day (no prescribed movements). */
export function isRestFocus(label: string): boolean {
  return label.trim().toLowerCase() === "rest day";
}
