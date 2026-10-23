/**
 * Functional, HIIT & conditioning library — the ergometers, ballistic lifts,
 * plyometrics, carries and classic circuit movements hybrid and conditioning
 * coaches program for rounds, work-intervals, distance, calories and heart rate.
 * Each name appears once.
 */

import type { MovementGroup } from "./index";

export const CONDITIONING_GROUPS: MovementGroup[] = [
  {
    group: "Machines & ergometers",
    names: [
      "Rowing erg",
      "Assault bike",
      "Echo bike",
      "SkiErg",
      "Treadmill run",
      "Stair climber",
      "Spin bike",
      "Elliptical",
      "Curved treadmill",
    ],
  },
  {
    group: "Running & carries",
    names: [
      "Shuttle run",
      "Sprint interval",
      "Tempo run",
      "Hill sprint",
      "Sled push",
      "Sled pull",
      "Farmer's carry",
      "Suitcase carry",
      "Front-rack carry",
      "Overhead carry",
      "Yoke walk",
    ],
  },
  {
    group: "Plyometrics",
    names: [
      "Box jump",
      "Broad jump",
      "Jump squat",
      "Jumping lunge",
      "Tuck jump",
      "Lateral bound",
      "Depth jump",
      "Jump rope",
      "Double-under",
      "Skater hop",
      "Pogo hop",
    ],
  },
  {
    group: "Ballistic & kettlebell",
    names: [
      "Kettlebell swing",
      "American kettlebell swing",
      "Kettlebell clean",
      "Kettlebell snatch",
      "Goblet squat",
      "Kettlebell clean and press",
      "Power clean",
      "Hang clean",
      "Push press",
      "Push jerk",
      "Thruster",
      "Medicine ball slam",
      "Wall ball",
      "Medicine ball throw",
    ],
  },
  {
    group: "Functional strength",
    names: [
      "Burpee",
      "Burpee over bar",
      "Devil's press",
      "Man maker",
      "Dumbbell snatch",
      "Clean and jerk",
      "Deadlift (conditioning)",
      "Sandbag clean",
      "Sandbag carry",
      "Tire flip",
      "Battle ropes",
      "Bear crawl",
      "Sled drag",
    ],
  },
  {
    group: "Core & midline",
    names: [
      "Toes-to-bar",
      "Hanging knee raise",
      "V-up",
      "Russian twist",
      "Sit-up",
      "Flutter kick",
      "Mountain climber",
      "Plank shoulder tap",
      "Hollow rock (conditioning)",
    ],
  },
  {
    group: "Agility & footwork",
    names: [
      "Agility ladder",
      "Cone drill",
      "5-10-5 pro agility",
      "High knees",
      "Butt kicks",
      "Lateral shuffle",
      "Carioca",
      "Box step-over",
    ],
  },
  {
    group: "Benchmark pieces",
    names: [
      "AMRAP circuit",
      "EMOM circuit",
      "For-time circuit",
      "Tabata interval",
      "Fran",
      "Cindy",
      "Murph",
      "Death by burpees",
    ],
  },
];
