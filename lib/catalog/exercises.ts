/**
 * Common exercise catalog, used for fast autocomplete in the logger and plan
 * builder, and to keep exercise names consistent so per-exercise progress
 * aggregates correctly. Trainers can still type any custom exercise.
 */

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Legs"
  | "Arms"
  | "Core"
  | "Full body"
  | "Cardio";

export interface ExerciseDef {
  name: string;
  group: MuscleGroup;
}

export const EXERCISE_CATALOG: ExerciseDef[] = [
  // Chest
  { name: "Bench press", group: "Chest" },
  { name: "Incline bench press", group: "Chest" },
  { name: "Dumbbell bench press", group: "Chest" },
  { name: "Incline dumbbell press", group: "Chest" },
  { name: "Chest fly", group: "Chest" },
  { name: "Cable crossover", group: "Chest" },
  { name: "Push-up", group: "Chest" },
  { name: "Dip", group: "Chest" },
  { name: "Machine chest press", group: "Chest" },
  // Back
  { name: "Deadlift", group: "Back" },
  { name: "Barbell row", group: "Back" },
  { name: "Dumbbell row", group: "Back" },
  { name: "Pull-up", group: "Back" },
  { name: "Chin-up", group: "Back" },
  { name: "Lat pulldown", group: "Back" },
  { name: "Seated cable row", group: "Back" },
  { name: "T-bar row", group: "Back" },
  { name: "Face pull", group: "Back" },
  { name: "Romanian deadlift", group: "Back" },
  { name: "Hyperextension", group: "Back" },
  // Shoulders
  { name: "Overhead press", group: "Shoulders" },
  { name: "Dumbbell shoulder press", group: "Shoulders" },
  { name: "Arnold press", group: "Shoulders" },
  { name: "Lateral raise", group: "Shoulders" },
  { name: "Front raise", group: "Shoulders" },
  { name: "Rear delt fly", group: "Shoulders" },
  { name: "Upright row", group: "Shoulders" },
  { name: "Shrug", group: "Shoulders" },
  // Legs
  { name: "Back squat", group: "Legs" },
  { name: "Front squat", group: "Legs" },
  { name: "Goblet squat", group: "Legs" },
  { name: "Leg press", group: "Legs" },
  { name: "Lunge", group: "Legs" },
  { name: "Walking lunge", group: "Legs" },
  { name: "Bulgarian split squat", group: "Legs" },
  { name: "Leg extension", group: "Legs" },
  { name: "Leg curl", group: "Legs" },
  { name: "Hip thrust", group: "Legs" },
  { name: "Calf raise", group: "Legs" },
  { name: "Step-up", group: "Legs" },
  // Arms
  { name: "Barbell curl", group: "Arms" },
  { name: "Dumbbell curl", group: "Arms" },
  { name: "Hammer curl", group: "Arms" },
  { name: "Preacher curl", group: "Arms" },
  { name: "Cable curl", group: "Arms" },
  { name: "Tricep pushdown", group: "Arms" },
  { name: "Overhead tricep extension", group: "Arms" },
  { name: "Skull crusher", group: "Arms" },
  { name: "Close-grip bench press", group: "Arms" },
  { name: "Tricep dip", group: "Arms" },
  // Core
  { name: "Plank", group: "Core" },
  { name: "Hanging leg raise", group: "Core" },
  { name: "Cable crunch", group: "Core" },
  { name: "Russian twist", group: "Core" },
  { name: "Ab wheel rollout", group: "Core" },
  { name: "Sit-up", group: "Core" },
  { name: "Mountain climber", group: "Core" },
  // Full body / Olympic
  { name: "Clean and jerk", group: "Full body" },
  { name: "Power clean", group: "Full body" },
  { name: "Snatch", group: "Full body" },
  { name: "Thruster", group: "Full body" },
  { name: "Kettlebell swing", group: "Full body" },
  { name: "Burpee", group: "Full body" },
  // Cardio
  { name: "Treadmill run", group: "Cardio" },
  { name: "Cycling", group: "Cardio" },
  { name: "Rowing", group: "Cardio" },
  { name: "Elliptical", group: "Cardio" },
  { name: "Stair climber", group: "Cardio" },
  { name: "Intervals", group: "Cardio" },
  { name: "Jump rope", group: "Cardio" },
];

export const EXERCISE_NAMES = EXERCISE_CATALOG.map((e) => e.name);

export const GROUP_BY_EXERCISE: Record<string, MuscleGroup> = Object.fromEntries(
  EXERCISE_CATALOG.map((e) => [e.name.toLowerCase(), e.group]),
);

/** Fuzzy-ish search over the catalog for autocomplete. */
export function searchExercises(query: string, limit = 8): ExerciseDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXERCISE_CATALOG.slice(0, limit);
  const starts: ExerciseDef[] = [];
  const contains: ExerciseDef[] = [];
  for (const e of EXERCISE_CATALOG) {
    const n = e.name.toLowerCase();
    if (n.startsWith(q)) starts.push(e);
    else if (n.includes(q)) contains.push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}
