/**
 * Strength & resistance movement library (barbell / dumbbell / machine / cable).
 * The original CoachPro catalog, grouped by muscle. Authored as compact groups;
 * the index (./index.ts) flattens and tags them with the "strength" modality.
 */

import type { MovementGroup } from "./index";

export const STRENGTH_GROUPS: MovementGroup[] = [
  {
    group: "Chest",
    names: [
      "Bench press",
      "Incline bench press",
      "Dumbbell bench press",
      "Incline dumbbell press",
      "Chest fly",
      "Cable crossover",
      "Push-up",
      "Dip",
      "Machine chest press",
    ],
  },
  {
    group: "Back",
    names: [
      "Deadlift",
      "Barbell row",
      "Dumbbell row",
      "Pull-up",
      "Chin-up",
      "Lat pulldown",
      "Seated cable row",
      "T-bar row",
      "Face pull",
      "Romanian deadlift",
      "Hyperextension",
    ],
  },
  {
    group: "Shoulders",
    names: [
      "Overhead press",
      "Dumbbell shoulder press",
      "Arnold press",
      "Lateral raise",
      "Front raise",
      "Rear delt fly",
      "Upright row",
      "Shrug",
    ],
  },
  {
    group: "Legs",
    names: [
      "Back squat",
      "Front squat",
      "Goblet squat",
      "Leg press",
      "Lunge",
      "Walking lunge",
      "Bulgarian split squat",
      "Leg extension",
      "Leg curl",
      "Hip thrust",
      "Calf raise",
      "Step-up",
    ],
  },
  {
    group: "Arms",
    names: [
      "Barbell curl",
      "Dumbbell curl",
      "Hammer curl",
      "Preacher curl",
      "Cable curl",
      "Tricep pushdown",
      "Overhead tricep extension",
      "Skull crusher",
      "Close-grip bench press",
      "Tricep dip",
    ],
  },
  {
    group: "Core",
    names: [
      "Plank",
      "Hanging leg raise",
      "Cable crunch",
      "Russian twist",
      "Ab wheel rollout",
      "Sit-up",
      "Mountain climber",
    ],
  },
  {
    group: "Full body",
    names: [
      "Clean and jerk",
      "Power clean",
      "Snatch",
      "Thruster",
      "Kettlebell swing",
      "Burpee",
    ],
  },
  {
    group: "Cardio",
    names: [
      "Treadmill run",
      "Cycling",
      "Rowing",
      "Elliptical",
      "Stair climber",
      "Intervals",
      "Jump rope",
    ],
  },
];
