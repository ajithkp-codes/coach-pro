import type { PlanDay, PlanItem } from "@/lib/types";
import type { Modality } from "@/lib/catalog/modalities";

/**
 * Starter training splits — seed a plan instantly with no AI call. Movement
 * names are drawn from the per-modality catalog so group chips and progress
 * tagging light up immediately. Each template declares the modality it's for;
 * the editor offers only the templates matching the plan's chosen modality.
 */
export interface SplitTemplate {
  key: string;
  modality: Modality;
  label: string;
  description: string;
  days: PlanDay[];
}

function item(exercise_name: string, sets: string, reps: string): PlanItem {
  return { exercise_name, sets, reps, weight: "", notes: "" };
}

/** Calisthenics line: reps and/or a hold (duration), no external load by default. */
function cItem(exercise_name: string, sets: string, reps: string, duration = ""): PlanItem {
  return { exercise_name, sets, reps, weight: "", notes: "", duration };
}

/** Flexible line for modalities that program fields beyond sets × reps × weight. */
function gItem(exercise_name: string, fields: Partial<PlanItem> = {}): PlanItem {
  return { exercise_name, sets: "", reps: "", weight: "", notes: "", ...fields };
}

function day(d: string, title: string, items: PlanItem[]): PlanDay {
  return { day: d, title, items };
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    key: "full-body-3",
    modality: "strength",
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
    modality: "strength",
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
    modality: "strength",
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

  // ---- Calisthenics / bodyweight ----
  {
    key: "calisthenics-foundations-3",
    modality: "calisthenics",
    label: "Foundations · 3 days",
    description: "Mon / Wed / Fri — full-body bodyweight basics for a new client.",
    days: [
      day("Mon", "Full body A", [
        cItem("Incline push-up", "3", "8"),
        cItem("Inverted row", "3", "8"),
        cItem("Bodyweight squat", "3", "12"),
        cItem("Plank", "3", "", "30s"),
        cItem("Dead bug", "3", "10"),
      ]),
      day("Wed", "Full body B", [
        cItem("Push-up", "3", "8"),
        cItem("Band-assisted pull-up", "3", "6"),
        cItem("Split squat", "3", "10"),
        cItem("Hollow body hold", "3", "", "20s"),
        cItem("Glute bridge", "3", "12"),
      ]),
      day("Fri", "Full body C", [
        cItem("Bench dip", "3", "10"),
        cItem("Australian row", "3", "10"),
        cItem("Reverse lunge", "3", "10"),
        cItem("Side plank", "3", "", "20s"),
        cItem("Superman hold", "3", "", "20s"),
      ]),
    ],
  },
  {
    key: "calisthenics-ppl-3",
    modality: "calisthenics",
    label: "Push / Pull / Legs · 3 days",
    description: "Mon / Wed / Fri — bodyweight split by movement pattern.",
    days: [
      day("Mon", "Push", [
        cItem("Push-up", "4", "10"),
        cItem("Pike push-up", "3", "8"),
        cItem("Parallel bar dip", "3", "8"),
        cItem("Diamond push-up", "3", "10"),
        cItem("Pseudo-planche push-up", "3", "", "20s"),
      ]),
      day("Wed", "Pull", [
        cItem("Pull-up", "4", "6"),
        cItem("Inverted row", "3", "10"),
        cItem("Chin-up", "3", "6"),
        cItem("Scapular pull-up", "3", "8"),
        cItem("Dead hang", "3", "", "30s"),
      ]),
      day("Fri", "Legs", [
        cItem("Bodyweight squat", "4", "15"),
        cItem("Bulgarian split squat", "3", "10"),
        cItem("Assisted pistol squat", "3", "6"),
        cItem("Nordic curl", "3", "5"),
        cItem("Calf raise", "4", "15"),
      ]),
    ],
  },
  {
    key: "calisthenics-skills-4",
    modality: "calisthenics",
    label: "Skills + strength · 4 days",
    description: "Mon / Tue / Thu / Fri — pair skill practice with strength work.",
    days: [
      day("Mon", "Push + handstand", [
        cItem("Wall handstand hold", "4", "", "30s"),
        cItem("Pike push-up", "4", "8"),
        cItem("Parallel bar dip", "3", "8"),
        cItem("Pseudo-planche push-up", "3", "", "20s"),
      ]),
      day("Tue", "Pull + lever", [
        cItem("Pull-up", "4", "6"),
        cItem("Front lever tuck", "4", "", "15s"),
        cItem("Inverted row", "3", "10"),
        cItem("Skin the cat", "3", "5"),
      ]),
      day("Thu", "Legs + core", [
        cItem("Pistol squat", "3", "5"),
        cItem("Bulgarian split squat", "3", "10"),
        cItem("Dragon flag", "3", "6"),
        cItem("Hollow body hold", "3", "", "25s"),
      ]),
      day("Fri", "Skills practice", [
        cItem("Freestanding handstand", "5", "", "20s"),
        cItem("Tuck planche", "5", "", "15s"),
        cItem("L-sit", "5", "", "15s"),
        cItem("Crow pose", "3", "", "20s"),
      ]),
    ],
  },

  // ---- Yoga, Pilates & mobility ----
  {
    key: "mobility-vinyasa-3",
    modality: "mobility",
    label: "Vinyasa flow · 3 days",
    description: "Mon / Wed / Fri — a balanced mind-body week of flow, strength and restore.",
    days: [
      day("Mon", "Grounding flow", [
        gItem("Cat-cow", { duration: "8 breaths", intensity: "warm spine" }),
        gItem("Downward-facing dog", { duration: "5 breaths" }),
        gItem("Warrior II", { duration: "5 breaths", reps: "per side" }),
        gItem("Triangle pose", { duration: "5 breaths", reps: "per side" }),
        gItem("Tree pose", { duration: "5 breaths", reps: "per side" }),
        gItem("Seated forward fold", { duration: "8 breaths" }),
        gItem("Corpse pose", { duration: "3 min", intensity: "release" }),
      ]),
      day("Wed", "Hips & twists", [
        gItem("Low lunge", { duration: "5 breaths", reps: "per side" }),
        gItem("Lizard pose", { duration: "6 breaths", reps: "per side" }),
        gItem("Pigeon pose", { duration: "8 breaths", reps: "per side" }),
        gItem("Seated spinal twist", { duration: "5 breaths", reps: "per side" }),
        gItem("Bound angle pose", { duration: "8 breaths" }),
        gItem("Supine spinal twist", { duration: "6 breaths", reps: "per side" }),
        gItem("Legs-up-the-wall", { duration: "3 min" }),
      ]),
      day("Fri", "Strength & balance", [
        gItem("Plank pose", { duration: "30s" }),
        gItem("Chaturanga", { duration: "5 breaths" }),
        gItem("Chair pose", { duration: "6 breaths" }),
        gItem("Warrior III", { duration: "5 breaths", reps: "per side" }),
        gItem("Half-moon pose", { duration: "5 breaths", reps: "per side" }),
        gItem("Bridge pose", { duration: "6 breaths" }),
        gItem("Child's pose", { duration: "2 min" }),
      ]),
    ],
  },

  // ---- Functional, HIIT & conditioning ----
  {
    key: "conditioning-hiit-3",
    modality: "conditioning",
    label: "HIIT & circuits · 3 days",
    description: "Mon / Wed / Fri — intervals, a conditioning circuit and a benchmark piece.",
    days: [
      day("Mon", "Intervals", [
        gItem("Rowing erg", { rounds: "6", duration: "250m", intensity: "90s rest" }),
        gItem("Assault bike", { rounds: "6", duration: "20s", intensity: "40s rest" }),
        gItem("Jump rope", { rounds: "4", duration: "60s", intensity: "30s rest" }),
      ]),
      day("Wed", "Full-body circuit", [
        gItem("Kettlebell swing", { rounds: "5", reps: "15" }),
        gItem("Goblet squat", { rounds: "5", reps: "12" }),
        gItem("Burpee", { rounds: "5", reps: "10" }),
        gItem("Wall ball", { rounds: "5", reps: "15" }),
        gItem("Farmer's carry", { rounds: "5", distance: "40m" }),
      ]),
      day("Fri", "Benchmark", [
        gItem("AMRAP circuit", { duration: "12 min", intensity: "steady" }),
        gItem("Box jump", { reps: "10" }),
        gItem("Thruster", { reps: "10" }),
        gItem("Toes-to-bar", { reps: "10" }),
      ]),
    ],
  },

  // ---- Longevity & healthy-aging ----
  {
    key: "longevity-foundations-3",
    modality: "longevity",
    label: "Healthy-aging foundations · 3 days",
    description: "Mon / Wed / Fri — strength, balance and mobility for older adults.",
    days: [
      day("Mon", "Strength & balance", [
        gItem("Sit-to-stand", { sets: "3", reps: "10", intensity: "controlled" }),
        gItem("Step-up", { sets: "3", reps: "8", weight: "bodyweight" }),
        gItem("Wall push-up", { sets: "3", reps: "10" }),
        gItem("Single-leg stand", { sets: "3", duration: "20s", reps: "per side" }),
        gItem("Glute bridge (floor)", { sets: "3", reps: "12" }),
      ]),
      day("Wed", "Mobility & posture", [
        gItem("Bird dog", { sets: "3", reps: "8", intensity: "per side" }),
        gItem("Open-book rotation", { sets: "2", reps: "8", intensity: "per side" }),
        gItem("Hip flexor stretch", { duration: "30s", reps: "per side" }),
        gItem("Calf stretch", { duration: "30s", reps: "per side" }),
        gItem("Thoracic extension over chair", { sets: "2", reps: "8" }),
      ]),
      day("Fri", "Full body", [
        gItem("Box squat", { sets: "3", reps: "10", weight: "light" }),
        gItem("Seated row (band)", { sets: "3", reps: "12" }),
        gItem("Overhead press (light)", { sets: "3", reps: "10", weight: "light" }),
        gItem("Heel raise", { sets: "3", reps: "12" }),
        gItem("Dead bug (assisted)", { sets: "3", reps: "8" }),
      ]),
    ],
  },

  // ---- Lifestyle, activity & habits ----
  {
    key: "lifestyle-starter-5",
    modality: "lifestyle",
    label: "Active week starter · 5 days",
    description: "A gentle weekday activity + habit plan to pair with the nutrition tab.",
    days: [
      day("Mon", "Move", [
        gItem("Brisk walk", { duration: "30 min", intensity: "daily" }),
        gItem("Daily step target", { distance: "8,000 steps" }),
      ]),
      day("Tue", "Strength basics", [
        gItem("Bodyweight squat", { intensity: "2 sets of 12" }),
        gItem("Wall push-up", { intensity: "2 sets of 10" }),
        gItem("Glute bridge", { intensity: "2 sets of 12" }),
      ]),
      day("Wed", "Cardio", [
        gItem("Walk/jog intervals", { duration: "25 min" }),
        gItem("Daily step target", { distance: "8,000 steps" }),
      ]),
      day("Thu", "Mobility & habits", [
        gItem("5-minute stretch flow", { duration: "5 min" }),
        gItem("Hydration target", { intensity: "2.5 L" }),
        gItem("Sleep target", { intensity: "7–8 h" }),
      ]),
      day("Fri", "Move", [
        gItem("Post-meal walk", { duration: "20 min" }),
        gItem("Take the stairs", { intensity: "all day" }),
      ]),
    ],
  },
];

/** Starter templates offered for a given modality (empty = start blank / AI). */
export function templatesForModality(modality: Modality): SplitTemplate[] {
  return SPLIT_TEMPLATES.filter((t) => t.modality === modality);
}
