import type { PlanDay, PlanItem } from "@/lib/types";

/**
 * Starter training splits — seed a plan instantly with no AI call. Exercise
 * names are drawn from the catalog so muscle-focus chips and progress tagging
 * light up immediately. The trainer edits sets/reps/weight after seeding.
 */
export interface SplitTemplate {
  key: string;
  label: string;
  description: string;
  days: PlanDay[];
}

function item(exercise_name: string, sets: string, reps: string): PlanItem {
  return { exercise_name, sets, reps, weight: "", notes: "" };
}

function day(d: string, title: string, items: PlanItem[]): PlanDay {
  return { day: d, title, items };
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    key: "full-body-3",
    label: "Full body · 3 days",
    description: "Mon / Wed / Fri — balanced compound work, great for beginners.",
    days: [
      day("Mon", "Full body A", [
        item("Back squat", "3", "8"),
        item("Bench press", "3", "8"),
        item("Barbell row", "3", "10"),
        item("Overhead press", "2", "10"),
        item("Plank", "3", "45s"),
      ]),
      day("Wed", "Full body B", [
        item("Deadlift", "3", "5"),
        item("Incline bench press", "3", "8"),
        item("Lat pulldown", "3", "10"),
        item("Lunge", "3", "12"),
        item("Hanging leg raise", "3", "12"),
      ]),
      day("Fri", "Full body C", [
        item("Front squat", "3", "8"),
        item("Dumbbell bench press", "3", "10"),
        item("Seated cable row", "3", "12"),
        item("Lateral raise", "3", "15"),
        item("Cable crunch", "3", "15"),
      ]),
    ],
  },
  {
    key: "upper-lower",
    label: "Upper / Lower · 4 days",
    description: "Mon / Tue / Thu / Fri — more volume per muscle, two of each.",
    days: [
      day("Mon", "Upper A", [
        item("Bench press", "4", "6-8"),
        item("Barbell row", "4", "8"),
        item("Overhead press", "3", "10"),
        item("Lat pulldown", "3", "12"),
        item("Barbell curl", "3", "12"),
        item("Tricep pushdown", "3", "12"),
      ]),
      day("Tue", "Lower A", [
        item("Back squat", "4", "6-8"),
        item("Romanian deadlift", "3", "10"),
        item("Leg press", "3", "12"),
        item("Leg curl", "3", "12"),
        item("Calf raise", "4", "15"),
      ]),
      day("Thu", "Upper B", [
        item("Incline dumbbell press", "4", "8"),
        item("Pull-up", "4", "8"),
        item("Arnold press", "3", "10"),
        item("Seated cable row", "3", "12"),
        item("Hammer curl", "3", "12"),
        item("Skull crusher", "3", "12"),
      ]),
      day("Fri", "Lower B", [
        item("Deadlift", "4", "5"),
        item("Front squat", "3", "8"),
        item("Walking lunge", "3", "12"),
        item("Leg extension", "3", "15"),
        item("Hip thrust", "3", "12"),
      ]),
    ],
  },
  {
    key: "ppl",
    label: "Push / Pull / Legs · 3 days",
    description: "Mon / Wed / Fri — classic split by movement pattern.",
    days: [
      day("Mon", "Push", [
        item("Bench press", "4", "8"),
        item("Overhead press", "3", "10"),
        item("Incline dumbbell press", "3", "10"),
        item("Lateral raise", "3", "15"),
        item("Tricep pushdown", "3", "12"),
      ]),
      day("Wed", "Pull", [
        item("Deadlift", "3", "5"),
        item("Pull-up", "4", "8"),
        item("Barbell row", "3", "10"),
        item("Face pull", "3", "15"),
        item("Barbell curl", "3", "12"),
      ]),
      day("Fri", "Legs", [
        item("Back squat", "4", "8"),
        item("Romanian deadlift", "3", "10"),
        item("Leg press", "3", "12"),
        item("Leg curl", "3", "12"),
        item("Calf raise", "4", "15"),
      ]),
    ],
  },
];
