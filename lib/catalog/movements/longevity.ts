/**
 * Longevity & healthy-aging library — the balance, strength, mobility, gait and
 * corrective work that coaches for older adults and rehab/return-to-movement
 * clients program. Gentle, joint-friendly, and progressable; logged by reps,
 * holds, light load and side. Each name appears once.
 */

import type { MovementGroup } from "./index";

export const LONGEVITY_GROUPS: MovementGroup[] = [
  {
    group: "Balance & stability",
    names: [
      "Single-leg stand",
      "Tandem stance",
      "Heel-to-toe walk",
      "Weight shifts",
      "Clock reach",
      "Single-leg reach",
      "Balance pad stand",
      "Star excursion reach",
      "Tai chi weight shift",
    ],
  },
  {
    group: "Sit-to-stand & lower body",
    names: [
      "Sit-to-stand",
      "Box squat",
      "Supported squat",
      "Chair squat",
      "Step-up",
      "Lateral step-up",
      "Mini squat",
      "Wall sit",
      "Heel raise",
      "Toe raise",
      "Standing hip abduction",
      "Standing hip extension",
      "Seated leg extension",
      "Seated hamstring curl",
    ],
  },
  {
    group: "Upper body & pulling",
    names: [
      "Wall push-up",
      "Counter push-up",
      "Seated row (band)",
      "Band pull-apart",
      "Overhead press (light)",
      "Lateral raise (light)",
      "Biceps curl (light)",
      "Triceps extension (light)",
      "Scapular retraction",
      "Wall angel",
    ],
  },
  {
    group: "Core & posture",
    names: [
      "Seated marching",
      "Dead bug (assisted)",
      "Bird dog",
      "Pelvic tilt",
      "Glute bridge (floor)",
      "Standing anti-rotation press",
      "Modified side plank",
      "Chin tuck",
      "Thoracic extension over chair",
    ],
  },
  {
    group: "Mobility & flexibility",
    names: [
      "Ankle pumps",
      "Seated knee extension stretch",
      "Hip flexor stretch",
      "Hamstring stretch",
      "Calf stretch",
      "Chest doorway stretch",
      "Neck side stretch",
      "Shoulder rolls",
      "Seated spinal rotation",
      "Open-book rotation",
    ],
  },
  {
    group: "Gait & walking",
    names: [
      "Overground walking",
      "Treadmill walking",
      "Marching in place",
      "Side-stepping",
      "Braiding steps",
      "Backward walking",
      "Obstacle step-over",
      "Stair practice",
    ],
  },
  {
    group: "Corrective & rehab",
    names: [
      "Clamshell",
      "Side-lying hip abduction",
      "Glute bridge march",
      "Terminal knee extension",
      "Ankle dorsiflexion (band)",
      "Rotator cuff external rotation",
      "Rotator cuff internal rotation",
      "Prone Y raise",
      "Prone T raise",
      "Standing calf stretch (wall)",
      "Nerve glide",
    ],
  },
];
