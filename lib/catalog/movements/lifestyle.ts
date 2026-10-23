/**
 * Lifestyle, activity & habit library — the daily-movement targets, low-friction
 * cardio, mobility breaks and habit checks a weight-management / lifestyle coach
 * assigns alongside the nutrition tab. Logged by minutes, steps/distance and
 * effort rather than load. Each name appears once.
 */

import type { MovementGroup } from "./index";

export const LIFESTYLE_GROUPS: MovementGroup[] = [
  {
    group: "Daily movement",
    names: [
      "Daily step target",
      "Brisk walk",
      "Evening walk",
      "Walking meeting",
      "Take the stairs",
      "Standing breaks",
      "Post-meal walk",
      "Active commute",
      "Household activity",
      "Playing with kids",
    ],
  },
  {
    group: "Cardio & intervals",
    names: [
      "Walk/jog intervals",
      "Jog",
      "Cycling",
      "Swimming",
      "Hiking",
      "Dance workout",
      "Elliptical session",
      "Rowing session",
      "Group fitness class",
      "Recreational sport",
    ],
  },
  {
    group: "Light strength",
    names: [
      "Bodyweight squat",
      "Wall push-up",
      "Glute bridge",
      "Band row",
      "Sit-to-stand",
      "Step-up",
      "Standing calf raise",
      "Plank",
    ],
  },
  {
    group: "Mobility breaks",
    names: [
      "Desk shoulder rolls",
      "Standing back extension",
      "Neck stretch",
      "Hip flexor stretch",
      "Seated spinal twist",
      "Calf stretch",
      "5-minute stretch flow",
    ],
  },
  {
    group: "Habit targets",
    names: [
      "Hydration target",
      "Sleep target",
      "Steps goal",
      "Screen-time limit",
      "Mindfulness minutes",
      "Food logging",
      "Weigh-in check",
      "Protein target",
    ],
  },
];
