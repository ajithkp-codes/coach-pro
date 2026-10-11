// Seed a demo trainer with rich, realistic sample data across the whole app.
// Usage: npm run seed   (reads keys from .env.local)
// Requires migrations 0001–0004 applied.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@coachpro.app";
const DEMO_PASSWORD = "coachpro-demo-123";
const BUCKET = "client-photos";

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const round = (n, p = 1) => Math.round(n * 10 ** p) / 10 ** p;
// Evenly spaced dates over `spanDays`, oldest first.
const dates = (count, spanDays = 90) =>
  Array.from({ length: count }, (_, i) =>
    daysAgo(Math.round(spanDays - (spanDays * i) / (count - 1))),
  );
const lerp = (a, b, i, n) => round(a + (b - a) * (i / (n - 1)));

// ---- Client blueprints -----------------------------------------------------
const CLIENTS = [
  {
    full_name: "Aarav Sharma", sex: "male", date_of_birth: "1990-05-12",
    phone: "+91 98765 43210", notes: "Training for a half marathon. Watching cholesterol.",
    height: 178, weight: [84, 79.3], fat: [22, 18.5], waist: [94, 87],
    markers: { total_cholesterol: [210, 198, 188], hdl: [38, 42, 46] },
    goals: [
      { title: "Reach 77 kg", category: "health", metric_key: "weight_kg", start_value: 84, target_value: 77, target_unit: "kg", target_date: daysAgo(-45), status: "active" },
      { title: "Total cholesterol under 180", category: "health", metric_key: "total_cholesterol", start_value: 210, target_value: 180, target_unit: "mg/dL", status: "active" },
    ],
    training: "push", photos: true, share: true,
  },
  {
    full_name: "Priya Nair", sex: "female", date_of_birth: "1995-11-03",
    notes: "Strength + fat loss. Pre-diabetic range — monitoring glucose.",
    height: 162, weight: [68, 63.8], fat: [31, 26], waist: [82, 74],
    markers: { fasting_glucose: [118, 108, 99], hba1c: [6.1, 5.8, 5.6] },
    goals: [
      { title: "Fasting glucose under 95", category: "health", metric_key: "fasting_glucose", start_value: 118, target_value: 95, target_unit: "mg/dL", status: "active" },
      { title: "Lose 5 kg", category: "health", metric_key: "weight_kg", start_value: 68, target_value: 63, target_unit: "kg", target_date: daysAgo(-20), status: "active" },
    ],
    training: "full", share: true,
  },
  {
    full_name: "Rohan Mehta", sex: "male", date_of_birth: "1988-02-20",
    phone: "+91 90000 11111", notes: "Lean bulk. Focus on compound strength.",
    height: 182, weight: [76, 80.5], fat: [15, 16], waist: [80, 82],
    markers: { vitamin_d: [28, 34, 41] },
    goals: [
      { title: "Bulk to 82 kg", category: "workout", metric_key: "weight_kg", start_value: 76, target_value: 82, target_unit: "kg", target_date: daysAgo(-30), status: "active" },
    ],
    training: "push",
  },
  {
    full_name: "Sneha Reddy", sex: "female", date_of_birth: "1992-07-09",
    notes: "General fitness. Low vitamin D, supplementing.",
    height: 165, weight: [61, 59.5], fat: [27, 25], waist: [74, 71],
    markers: { vitamin_d: [18, 24], total_cholesterol: [185, 178] },
    goals: [
      { title: "Vitamin D above 30", category: "health", metric_key: "vitamin_d", start_value: 18, target_value: 30, target_unit: "ng/mL", status: "active" },
    ],
    training: null,
  },
  {
    full_name: "Vikram Singh", sex: "male", date_of_birth: "1983-09-15",
    phone: "+91 99888 77665", notes: "Hypertension — GP-supervised. Gentle progression.",
    height: 175, weight: [92, 88], fat: [28, 26], waist: [102, 98],
    markers: { bp_systolic: [148, 142, 138], bp_diastolic: [96, 92, 88] },
    goals: [
      { title: "Systolic under 130", category: "health", metric_key: "bp_systolic", start_value: 148, target_value: 130, target_unit: "mmHg", target_date: daysAgo(-60), status: "active" },
    ],
    training: "full",
  },
  {
    full_name: "Ananya Iyer", sex: "female", date_of_birth: "1998-01-25",
    notes: "Marathon prep. Hit her weight goal — now maintaining.",
    height: 168, weight: [64, 58], fat: [24, 19], waist: [76, 68],
    markers: { hdl: [52, 58], triglycerides: [120, 95] },
    goals: [
      { title: "Reach 58 kg", category: "health", metric_key: "weight_kg", start_value: 64, target_value: 58, target_unit: "kg", status: "achieved" },
      { title: "Run a sub-2:00 half", category: "workout", status: "active" },
    ],
    training: "full",
  },
];

function photoSVG(label, hue) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="hsl(${hue},70%,82%)"/>
    <stop offset="100%" stop-color="hsl(${hue + 20},65%,62%)"/>
  </linearGradient></defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <g fill="hsla(${hue},40%,30%,0.35)">
    <circle cx="300" cy="250" r="70"/>
    <rect x="215" y="330" width="170" height="260" rx="60"/>
    <rect x="250" y="560" width="45" height="170" rx="22"/>
    <rect x="305" y="560" width="45" height="170" rx="22"/>
  </g>
  <rect x="0" y="710" width="600" height="90" fill="rgba(15,23,42,0.55)"/>
  <text x="40" y="765" font-family="Arial, sans-serif" font-size="34" fill="#fff" font-weight="bold">${label}</text>
</svg>`,
    "utf8",
  );
}

async function getTrainerId() {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
    user_metadata: { full_name: "Jordan Fox", business_name: "Peak Form Coaching" },
  });
  if (!error) return data.user.id;
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list.users.find((x) => x.email === DEMO_EMAIL);
  if (!u) throw error;
  return u.id;
}

async function main() {
  const trainerId = await getTrainerId();
  await admin.from("trainers").upsert({
    id: trainerId, email: DEMO_EMAIL, full_name: "Jordan Fox", business_name: "Peak Form Coaching",
  });
  await admin.from("clients").delete().eq("trainer_id", trainerId);
  console.log(`Trainer ready: ${DEMO_EMAIL}`);

  let photoCount = 0;
  const idByName = {};
  for (const cfg of CLIENTS) {
    const { data: client } = await admin
      .from("clients")
      .insert({
        trainer_id: trainerId, full_name: cfg.full_name, sex: cfg.sex,
        date_of_birth: cfg.date_of_birth, phone: cfg.phone ?? null, notes: cfg.notes,
        consent_given: true, consent_at: new Date().toISOString(),
      })
      .select("id").single();
    const cid = client.id;
    idByName[cfg.full_name] = cid;

    // Body metrics (6 points over 90 days)
    const mDates = dates(6);
    const metrics = mDates.map((d, i) => ({
      trainer_id: trainerId, client_id: cid, measured_on: d,
      weight_kg: lerp(cfg.weight[0], cfg.weight[1], i, 6),
      height_cm: cfg.height,
      body_fat_pct: lerp(cfg.fat[0], cfg.fat[1], i, 6),
      waist_cm: lerp(cfg.waist[0], cfg.waist[1], i, 6),
    }));
    await admin.from("body_metrics").insert(metrics);

    // Health markers
    const markerRows = [];
    for (const [key, vals] of Object.entries(cfg.markers)) {
      const d = dates(vals.length);
      vals.forEach((v, i) =>
        markerRows.push({ trainer_id: trainerId, client_id: cid, measured_on: d[i], marker_key: key, value: v }),
      );
    }
    if (markerRows.length) await admin.from("health_markers").insert(markerRows);

    // Goals
    if (cfg.goals?.length) {
      await admin.from("goals").insert(
        cfg.goals.map((g) => ({
          trainer_id: trainerId, client_id: cid, ...g,
          achieved_at: g.status === "achieved" ? new Date().toISOString() : null,
        })),
      );
    }

    // Training
    if (cfg.training) {
      const tDates = dates(3, 42);
      const { data: sess } = await admin
        .from("workout_sessions")
        .insert(tDates.map((d, i) => ({
          trainer_id: trainerId, client_id: cid, performed_on: d,
          title: cfg.training === "push" ? "Upper body" : "Full body", duration_min: 55 + i * 3,
        })))
        .select("id, performed_on");
      const ordered = [...sess].sort((a, b) => (a.performed_on < b.performed_on ? -1 : 1));
      const prog = [50, 55, 60];
      const setRows = [];
      ordered.forEach((s, i) => {
        const w = prog[i];
        const lifts = cfg.training === "push"
          ? [["Bench press", w + 10], ["Overhead press", w - 15], ["Barbell row", w]]
          : [["Back squat", w + 20], ["Deadlift", w + 35], ["Pull-up", 0]];
        lifts.forEach(([name, base], li) => {
          for (let p = 0; p < 3; p++)
            setRows.push({
              trainer_id: trainerId, client_id: cid, session_id: s.id, position: li * 3 + p,
              exercise_name: name, reps: name === "Pull-up" ? 8 : 8, weight_kg: base || null, rpe: 7 + p * 0.5,
            });
        });
      });
      await admin.from("workout_sets").insert(setRows);
    }

    // Photos
    if (cfg.photos) {
      const shots = [
        { label: `Front · ${daysAgo(84)}`, taken_on: daysAgo(84), hue: 210 },
        { label: `Side · ${daysAgo(84)}`, taken_on: daysAgo(84), hue: 265 },
        { label: `Front · ${daysAgo(7)}`, taken_on: daysAgo(7), hue: 160 },
        { label: `Side · ${daysAgo(7)}`, taken_on: daysAgo(7), hue: 25 },
      ];
      for (const s of shots) {
        const path = `${trainerId}/${cid}/${crypto.randomUUID()}.svg`;
        const up = await admin.storage.from(BUCKET).upload(path, photoSVG(s.label, s.hue), {
          contentType: "image/svg+xml", upsert: true,
        });
        if (!up.error) {
          await admin.from("client_photos").insert({
            trainer_id: trainerId, client_id: cid, storage_path: path,
            taken_on: s.taken_on, caption: s.label,
          });
          photoCount++;
        }
      }
    }

    // Shared file (workout plan)
    if (cfg.share) {
      const plan = `TRAINING PLAN — ${cfg.full_name}\nPeak Form Coaching\n\nMon: Lower body\nWed: Upper body\nFri: Conditioning\n\nNotes: progress load by ~2.5kg when all sets hit target reps.\n`;
      const fpath = `${trainerId}/${cid}/${crypto.randomUUID()}.txt`;
      const up = await admin.storage.from("shared-files").upload(fpath, Buffer.from(plan, "utf8"), {
        contentType: "text/plain", upsert: true,
      });
      if (!up.error) {
        await admin.from("shared_files").insert({
          trainer_id: trainerId, client_id: cid, storage_path: fpath,
          original_name: "training-plan.txt", content_type: "text/plain",
          size_bytes: plan.length, title: "Current training plan",
          token: randomBytes(24).toString("base64url"),
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }
    }

    console.log(`  ✓ ${cfg.full_name}`);
  }

  // Reminders (a mix of overdue / due today / upcoming / general)
  await admin.from("reminders").insert([
    { trainer_id: trainerId, client_id: idByName["Vikram Singh"], title: "Review blood pressure with GP", due_on: daysAgo(2), note: "Systolic still above target." },
    { trainer_id: trainerId, client_id: idByName["Priya Nair"], title: "Update measurements", due_on: daysAgo(0) },
    { trainer_id: trainerId, client_id: idByName["Aarav Sharma"], title: "Send new running plan", due_on: daysAgo(-3) },
    { trainer_id: trainerId, client_id: idByName["Sneha Reddy"], title: "Follow up on vitamin D", due_on: daysAgo(-6) },
    { trainer_id: trainerId, client_id: null, title: "Post this week's client check-ins", due_on: daysAgo(-1) },
  ]);

  // Weekly workout plans
  const item = (exercise_name, sets, reps, weight, notes = "") => ({ exercise_name, sets, reps, weight, notes });
  await admin.from("workout_plans").insert([
    {
      trainer_id: trainerId, client_id: idByName["Aarav Sharma"], name: "Upper / Lower split", is_active: true,
      notes: "Progress load by ~2.5kg when all sets hit the top of the rep range.",
      days: [
        { day: "Mon", title: "Upper", items: [item("Bench press", "4", "6-8", "70kg"), item("Barbell row", "4", "8-10", "60kg"), item("Overhead press", "3", "8-10", "40kg")] },
        { day: "Wed", title: "Lower", items: [item("Back squat", "4", "5", "90kg"), item("Romanian deadlift", "3", "8", "80kg"), item("Calf raise", "4", "12-15", "40kg")] },
        { day: "Fri", title: "Conditioning", items: [item("Intervals", "6", "400m", "", "90s rest")] },
      ],
    },
    {
      trainer_id: trainerId, client_id: idByName["Priya Nair"], name: "Full-body strength", is_active: true,
      notes: "Two sessions a week to start. Focus on form.",
      days: [
        { day: "Mon", title: "Full body A", items: [item("Goblet squat", "3", "10", "16kg"), item("Push-up", "3", "8-12", "bodyweight"), item("Dumbbell row", "3", "10", "12kg")] },
        { day: "Thu", title: "Full body B", items: [item("Deadlift", "3", "6", "50kg"), item("Lat pulldown", "3", "10", "35kg"), item("Plank", "3", "45s", "")] },
      ],
    },
  ]);

  console.log(`\nSeeded ${CLIENTS.length} clients, ${photoCount} photos, 5 reminders, 2 plans.`);
  console.log(`\nSign in:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
