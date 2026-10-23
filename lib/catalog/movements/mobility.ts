/**
 * Yoga, Pilates & mobility library — poses, flows, Pilates work and joint-mobility
 * drills, grouped the way mind-body coaches cue a session (standing → balance →
 * floor → backbends → twists → hips → core → mobility → restorative). Logged by
 * hold time / breaths and reps per side. Each name appears once.
 */

import type { MovementGroup } from "./index";

export const MOBILITY_GROUPS: MovementGroup[] = [
  {
    group: "Standing poses",
    names: [
      "Mountain pose",
      "Forward fold",
      "Halfway lift",
      "Chair pose",
      "Warrior I",
      "Warrior II",
      "Reverse warrior",
      "Extended side angle",
      "Triangle pose",
      "Wide-legged forward fold",
      "Pyramid pose",
      "Standing split",
      "Gorilla pose",
    ],
  },
  {
    group: "Balancing poses",
    names: [
      "Tree pose",
      "Eagle pose",
      "Warrior III",
      "Half-moon pose",
      "Dancer pose",
      "Standing hand-to-big-toe",
      "Chair twist balance",
      "Single-leg stand",
    ],
  },
  {
    group: "Sun salutation flow",
    names: [
      "Plank pose",
      "Chaturanga",
      "Upward-facing dog",
      "Downward-facing dog",
      "Low lunge",
      "High lunge",
      "Cat-cow",
      "Cobra pose",
    ],
  },
  {
    group: "Seated & forward folds",
    names: [
      "Staff pose",
      "Seated forward fold",
      "Head-to-knee forward fold",
      "Wide-angle seated fold",
      "Bound angle pose",
      "Hero pose",
      "Easy pose",
      "Cow-face pose",
    ],
  },
  {
    group: "Backbends",
    names: [
      "Bridge pose",
      "Wheel pose",
      "Camel pose",
      "Locust pose",
      "Bow pose",
      "Sphinx pose",
      "Fish pose",
      "Upward plank",
    ],
  },
  {
    group: "Twists",
    names: [
      "Seated spinal twist",
      "Supine spinal twist",
      "Revolved chair",
      "Revolved triangle",
      "Thread the needle",
    ],
  },
  {
    group: "Hip openers",
    names: [
      "Pigeon pose",
      "Lizard pose",
      "Low lunge hip opener",
      "Frog pose",
      "Happy baby",
      "Garland pose",
      "Fire log pose",
      "90/90 hip switch",
    ],
  },
  {
    group: "Inversions & arm balances",
    names: [
      "Legs-up-the-wall",
      "Shoulder stand",
      "Headstand",
      "Forearm stand",
      "Crow pose",
      "Side plank pose",
    ],
  },
  {
    group: "Pilates core",
    names: [
      "The hundred",
      "Roll-up",
      "Single-leg stretch",
      "Double-leg stretch",
      "Criss-cross",
      "Leg circles",
      "Spine stretch forward",
      "Saw",
      "Swan",
      "Side kick series",
      "Teaser",
      "Pilates bridge",
      "Swimming",
    ],
  },
  {
    group: "Mobility drills",
    names: [
      "Cat-cow mobilization",
      "Thoracic rotation",
      "Shoulder dislocates",
      "Hip CARs",
      "Shoulder CARs",
      "World's greatest stretch",
      "Deep squat hold",
      "Ankle rock",
      "Wrist circles",
      "Neck rolls",
      "Scapular wall slide",
    ],
  },
  {
    group: "Restorative & breath",
    names: [
      "Child's pose",
      "Corpse pose",
      "Reclined bound angle",
      "Supported fish",
      "Box breathing",
      "Alternate-nostril breathing",
      "Diaphragmatic breathing",
    ],
  },
];
