/**
 * Running library — the run types, workout structures and technique drills a
 * running coach programs. Unlike a lift, a running "movement" is a *kind of run*
 * (easy, long, tempo, intervals, hills…) the trainer then prescribes distance,
 * time, pace and recovery for. Grouped by training purpose so the focus picker
 * (lib/catalog/focus.ts) can filter to the day's intent. Each name appears once.
 *
 * The taxonomy follows mainstream endurance methodology — Daniels' five training
 * paces (Easy, Marathon, Threshold, Interval, Repetition), polarised 80/20
 * easy-vs-hard distribution, and the Hansons/Pfitzinger long-run + tempo staples
 * — expressed as the discrete sessions a coach actually writes into a week.
 */

import type { MovementGroup } from "./index";

export const RUNNING_GROUPS: MovementGroup[] = [
  {
    group: "Easy & recovery",
    names: [
      "Easy run",
      "Recovery run",
      "Shakeout run",
      "Easy run + strides",
      "Base-building run",
      "Aerobic run",
      "Run/walk intervals",
    ],
  },
  {
    group: "Long runs",
    names: [
      "Long run",
      "Easy long run",
      "Progression long run",
      "Long run with fast finish",
      "Marathon-pace long run",
      "Long run with tempo blocks",
      "Back-to-back long run",
    ],
  },
  {
    group: "Tempo & threshold",
    names: [
      "Tempo run",
      "Threshold run",
      "Cruise intervals",
      "Tempo intervals",
      "Progression run",
      "Steady-state run",
      "Threshold ladder",
    ],
  },
  {
    group: "Intervals & VO2max",
    names: [
      "400m repeats",
      "800m repeats",
      "1km repeats",
      "1200m repeats",
      "Mile repeats",
      "VO2max intervals",
      "Yasso 800s",
      "Fartlek",
      "Pyramid intervals",
      "30/30 intervals",
    ],
  },
  {
    group: "Hills & strength",
    names: [
      "Short hill repeats",
      "Long hill repeats",
      "Hill sprints",
      "Rolling hills run",
      "Treadmill incline run",
      "Hill circuit",
    ],
  },
  {
    group: "Speed & strides",
    names: [
      "Strides",
      "100m repeats",
      "200m repeats",
      "Flying sprints",
      "Acceleration runs",
      "Diagonals / pickups",
    ],
  },
  {
    group: "Race & time trial",
    names: [
      "Time trial",
      "Race-pace run",
      "Goal-pace intervals",
      "5K effort / parkrun",
      "Tune-up race",
      "Simulation run",
    ],
  },
  {
    group: "Drills & technique",
    names: [
      "A-skips",
      "B-skips",
      "High knees",
      "Butt kicks",
      "Ankling",
      "Carioca",
      "Straight-leg bounds",
      "Running form drills",
      "Cadence drill",
    ],
  },
  {
    group: "Warm-up & cool-down",
    names: [
      "Warm-up jog",
      "Dynamic warm-up",
      "Cool-down jog",
      "Walk recovery",
      "Mobility & stretch",
    ],
  },
];
