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
// Each client is populated across EVERY section: body metrics, health markers,
// goals, training, nutrition (plan + logs + sometimes a pending submission and a
// self-logging link), and for some: photos, a shared file, and a progress report.
//   diet:  [target_calories, target_protein_g]
//   style: "veg" | "nonveg" | "highprotein"  (drives the meal bank)
//   logLink / submissions / report: Phase-C and report coverage toggles
const CLIENTS = [
  {
    full_name: "Aarav Sharma", sex: "male", date_of_birth: "1990-05-12",
    phone: "+91 98765 43210", email: "aarav.sharma@example.com",
    notes: "Training for a half marathon. Watching cholesterol.",
    height: 178, weight: [84, 79.3], fat: [22, 18.5], waist: [94, 87],
    markers: { total_cholesterol: [210, 198, 188], hdl: [38, 42, 46] },
    goals: [
      { title: "Reach 77 kg", category: "health", metric_key: "weight_kg", start_value: 84, target_value: 77, target_unit: "kg", target_date: daysAgo(-45), status: "active" },
      { title: "Total cholesterol under 180", category: "health", metric_key: "total_cholesterol", start_value: 210, target_value: 180, target_unit: "mg/dL", status: "active" },
    ],
    training: "push", photos: true, share: true,
    diet: [2300, 150], style: "nonveg", logLink: true, report: "6m",
  },
  {
    full_name: "Priya Nair", sex: "female", date_of_birth: "1995-11-03",
    email: "priya.nair@example.com",
    notes: "Strength + fat loss. Pre-diabetic range — monitoring glucose.",
    height: 162, weight: [68, 63.8], fat: [31, 26], waist: [82, 74],
    markers: { fasting_glucose: [118, 108, 99], hba1c: [6.1, 5.8, 5.6] },
    goals: [
      { title: "Fasting glucose under 95", category: "health", metric_key: "fasting_glucose", start_value: 118, target_value: 95, target_unit: "mg/dL", status: "active" },
      { title: "Lose 5 kg", category: "health", metric_key: "weight_kg", start_value: 68, target_value: 63, target_unit: "kg", target_date: daysAgo(-20), status: "active" },
    ],
    training: "full", share: true,
    diet: [1700, 120], style: "veg", logLink: true, submissions: 1, report: "3m",
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
    diet: [2900, 180], style: "nonveg",
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
    diet: [1800, 90], style: "veg",
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
    diet: [2000, 110], style: "nonveg", report: "6m", reportRevoked: true,
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
    diet: [2100, 110], style: "veg", report: "12m",
  },
  {
    full_name: "Kabir Khanna", sex: "male", date_of_birth: "1991-03-08",
    phone: "+91 98111 22333", email: "kabir.khanna@example.com",
    notes: "Powerlifting block. Pushing protein hard. Logs most meals himself.",
    height: 180, weight: [88, 92], fat: [18, 17], waist: [88, 89],
    markers: { total_cholesterol: [192, 188], vitamin_d: [30, 38], triglycerides: [140, 118] },
    goals: [
      { title: "Deadlift 200 kg", category: "workout", status: "active" },
      { title: "Protein 190 g daily", category: "health", status: "active" },
      { title: "Bulk to 92 kg", category: "workout", metric_key: "weight_kg", start_value: 88, target_value: 92, target_unit: "kg", status: "achieved" },
    ],
    training: "push", photos: true, share: true,
    diet: [3000, 190], style: "highprotein", logLink: true, submissions: 2, report: "all",
  },
  {
    full_name: "Meera Joshi", sex: "female", date_of_birth: "1993-06-22",
    phone: "+91 97000 44556", notes: "PCOS — fat loss and insulin sensitivity focus.",
    height: 160, weight: [74, 69], fat: [34, 30], waist: [90, 83],
    markers: { fasting_glucose: [112, 104, 98], hba1c: [5.9, 5.7, 5.5], triglycerides: [168, 140, 122] },
    goals: [
      { title: "HbA1c under 5.6", category: "health", metric_key: "hba1c", start_value: 5.9, target_value: 5.6, target_unit: "%", status: "active" },
      { title: "Lose 8 kg", category: "health", metric_key: "weight_kg", start_value: 74, target_value: 66, target_unit: "kg", target_date: daysAgo(-50), status: "active" },
    ],
    training: "full",
    diet: [1600, 110], style: "veg", logLink: true, submissions: 1,
  },
  {
    full_name: "Arjun Rao", sex: "male", date_of_birth: "1987-12-14",
    email: "arjun.rao@example.com", notes: "Endurance cyclist. High training volume, watching lipids.",
    height: 176, weight: [72, 70.5], fat: [16, 14], waist: [82, 79],
    markers: { total_cholesterol: [205, 190, 182], ldl: [138, 122, 110], hdl: [44, 48, 52] },
    goals: [
      { title: "LDL under 100", category: "health", metric_key: "ldl", start_value: 138, target_value: 100, target_unit: "mg/dL", status: "active" },
    ],
    training: "full",
    diet: [2600, 130], style: "nonveg", report: "6m",
  },
  {
    full_name: "Divya Menon", sex: "female", date_of_birth: "1994-04-30",
    notes: "Postnatal return to training. Rebuilding core strength gradually.",
    height: 164, weight: [70, 66], fat: [32, 29], waist: [88, 81],
    markers: { vitamin_d: [20, 27, 33], hdl: [50, 54] },
    goals: [
      { title: "Return to pre-pregnancy weight", category: "health", metric_key: "weight_kg", start_value: 70, target_value: 62, target_unit: "kg", target_date: daysAgo(-75), status: "active" },
      { title: "Hold a 60s plank", category: "workout", status: "paused" },
    ],
    training: null,
    diet: [1900, 100], style: "veg",
  },
  {
    full_name: "Sameer Gupta", sex: "male", date_of_birth: "1980-08-19",
    phone: "+91 90123 45678", notes: "Desk job, hypertension + weight. Needs sustainable habits.",
    height: 173, weight: [96, 90], fat: [30, 27], waist: [106, 99],
    markers: { bp_systolic: [150, 144, 139], bp_diastolic: [98, 94, 90], fasting_glucose: [106, 101] },
    goals: [
      { title: "Lose 10 kg", category: "health", metric_key: "weight_kg", start_value: 96, target_value: 86, target_unit: "kg", target_date: daysAgo(-40), status: "active" },
      { title: "Systolic under 135", category: "health", metric_key: "bp_systolic", start_value: 150, target_value: 135, target_unit: "mmHg", status: "active" },
    ],
    training: "full", share: true,
    diet: [2200, 120], style: "nonveg", report: "6m",
  },
  {
    full_name: "Tanvi Desai", sex: "female", date_of_birth: "1996-10-11",
    email: "tanvi.desai@example.com", notes: "Physique competition prep. Strict macros, high protein.",
    height: 167, weight: [60, 56], fat: [22, 16], waist: [70, 64],
    markers: { hdl: [56, 60], total_cholesterol: [172, 168] },
    goals: [
      { title: "Stage weight 55 kg", category: "health", metric_key: "weight_kg", start_value: 60, target_value: 55, target_unit: "kg", target_date: daysAgo(-25), status: "active" },
      { title: "Protein 150 g daily", category: "health", status: "active" },
    ],
    training: "push", photos: true,
    diet: [1900, 150], style: "highprotein", logLink: true, submissions: 1, report: "3m",
  },
];

// ---- Nutrition meal bank ----------------------------------------------------
// Realistic India-first meals with approximate per-serving kcal + protein (g).
const MEAL_BANK = {
  veg: {
    breakfast: [
      { food: "Masala oats", qty: "1 bowl", kcal: 300, protein: 12 },
      { food: "Paneer bhurji + 2 roti", qty: "1 plate", kcal: 360, protein: 20 },
      { food: "Poha with peanuts", qty: "1 bowl", kcal: 280, protein: 8 },
    ],
    lunch: [
      { food: "Dal, rice & mixed veg", qty: "1 plate", kcal: 480, protein: 18 },
      { food: "Rajma chawal", qty: "1 plate", kcal: 500, protein: 18 },
      { food: "Chole + 2 roti", qty: "1 plate", kcal: 460, protein: 17 },
    ],
    snack: [
      { food: "Greek yogurt", qty: "150 g", kcal: 120, protein: 15 },
      { food: "Sprouts chaat", qty: "1 bowl", kcal: 180, protein: 11 },
      { food: "Fruit & almonds", qty: "1 serving", kcal: 210, protein: 6 },
    ],
    dinner: [
      { food: "Paneer curry + 2 roti", qty: "1 plate", kcal: 440, protein: 24 },
      { food: "Tofu stir-fry + quinoa", qty: "1 bowl", kcal: 400, protein: 22 },
      { food: "Mixed veg + dal + rice", qty: "1 plate", kcal: 430, protein: 18 },
    ],
  },
  nonveg: {
    breakfast: [
      { food: "Egg bhurji + 2 toast", qty: "1 plate", kcal: 340, protein: 22 },
      { food: "3 boiled eggs + oats", qty: "1 serving", kcal: 360, protein: 24 },
      { food: "Chicken sandwich", qty: "1", kcal: 390, protein: 26 },
    ],
    lunch: [
      { food: "Chicken curry + rice", qty: "1 plate", kcal: 540, protein: 38 },
      { food: "Fish curry + rice", qty: "1 plate", kcal: 500, protein: 34 },
      { food: "Egg curry + 2 roti", qty: "1 plate", kcal: 460, protein: 26 },
    ],
    snack: [
      { food: "Whey shake", qty: "1 scoop", kcal: 160, protein: 30 },
      { food: "Greek yogurt", qty: "150 g", kcal: 120, protein: 15 },
      { food: "Boiled eggs (2)", qty: "2", kcal: 140, protein: 12 },
    ],
    dinner: [
      { food: "Grilled chicken + veg", qty: "1 plate", kcal: 430, protein: 44 },
      { food: "Tandoori fish + salad", qty: "1 plate", kcal: 380, protein: 38 },
      { food: "Chicken + 2 roti", qty: "1 plate", kcal: 470, protein: 36 },
    ],
  },
  highprotein: {
    breakfast: [
      { food: "4 egg-white omelette + oats", qty: "1 serving", kcal: 340, protein: 32 },
      { food: "Protein pancakes", qty: "3", kcal: 380, protein: 34 },
      { food: "Paneer + egg bhurji", qty: "1 plate", kcal: 360, protein: 34 },
    ],
    lunch: [
      { food: "Grilled chicken + rice + salad", qty: "1 plate", kcal: 560, protein: 52 },
      { food: "Fish + quinoa bowl", qty: "1 bowl", kcal: 520, protein: 46 },
      { food: "Paneer tikka + rice", qty: "1 plate", kcal: 540, protein: 40 },
    ],
    snack: [
      { food: "Double whey shake", qty: "2 scoops", kcal: 260, protein: 50 },
      { food: "Greek yogurt + whey", qty: "1 bowl", kcal: 220, protein: 38 },
      { food: "Cottage cheese", qty: "150 g", kcal: 180, protein: 24 },
    ],
    dinner: [
      { food: "Chicken breast + veg", qty: "250 g", kcal: 440, protein: 56 },
      { food: "Egg whites + paneer salad", qty: "1 plate", kcal: 400, protein: 48 },
      { food: "Grilled fish + greens", qty: "1 plate", kcal: 380, protein: 44 },
    ],
  },
};

const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

// Two plan-day templates (training / rest) from the client's meal style.
function buildPlanDays(style) {
  const b = MEAL_BANK[style] ?? MEAL_BANK.veg;
  const toItem = (p) => ({ food: p.food, qty: p.qty, calories: String(p.kcal), protein: String(p.protein), notes: "" });
  const day = (label, title, offset, extraSnack) => ({
    day: label,
    title,
    meals: [
      { meal: "breakfast", time: "08:00", items: [toItem(pick(b.breakfast, offset))] },
      { meal: "lunch", time: "13:00", items: [toItem(pick(b.lunch, offset))] },
      { meal: "snack", time: "17:00", items: extraSnack ? [toItem(pick(b.snack, offset)), toItem(pick(b.snack, offset + 1))] : [toItem(pick(b.snack, offset))] },
      { meal: "dinner", time: "20:30", items: [toItem(pick(b.dinner, offset))] },
    ],
  });
  return [day("Mon", "Training day", 0, true), day("Thu", "Rest day", 1, false)];
}

// One day's actual entries, numbers jittered by `factor` to vary adherence.
function buildLogEntries(style, seed, factor) {
  const b = MEAL_BANK[style] ?? MEAL_BANK.veg;
  const mk = (meal, time, p) => ({
    meal, eaten_at: time,
    food: p.food, quantity: p.qty,
    calories: Math.round(p.kcal * factor),
    protein_g: round(p.protein * factor, 0),
  });
  return [
    mk("breakfast", "08:10", pick(b.breakfast, seed)),
    mk("lunch", "13:20", pick(b.lunch, seed + 1)),
    mk("snack", "17:05", pick(b.snack, seed)),
    mk("dinner", "20:40", pick(b.dinner, seed + 2)),
  ];
}

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
  let planCount = 0, logCount = 0, submissionCount = 0, logLinkCount = 0;
  const idByName = {};
  for (const cfg of CLIENTS) {
    const { data: client } = await admin
      .from("clients")
      .insert({
        trainer_id: trainerId, full_name: cfg.full_name, sex: cfg.sex,
        date_of_birth: cfg.date_of_birth, phone: cfg.phone ?? null,
        email: cfg.email ?? null, notes: cfg.notes,
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

    // Nutrition — plan, logs (+entries), optional self-logging link & submissions
    if (cfg.diet) {
      const [kcal, protein] = cfg.diet;
      const style = cfg.style ?? "veg";

      // An older intro plan (archived) + the current active plan.
      await admin.from("diet_plans").insert([
        {
          trainer_id: trainerId, client_id: cid, name: "Intro plan", is_active: false,
          target_calories: kcal + 150, target_protein_g: Math.max(60, protein - 20),
          notes: "Starter week — ease into the routine.", days: buildPlanDays(style),
        },
        {
          trainer_id: trainerId, client_id: cid, name: `${kcal} kcal · ${protein}g protein`, is_active: true,
          target_calories: kcal, target_protein_g: protein,
          notes: "Hit protein first, then fill calories. Water 3L/day. Two training-day templates and a rest-day template.",
          days: buildPlanDays(style),
        },
      ]);
      planCount += 2;

      // Daily logs across the last two weeks, with a couple of natural gaps.
      // Days 0–1 are left free for any pending client submissions below.
      const factors = [0.95, 1.08, 1.15, 0.9, 1.05, 1.12, 0.98, 1.1, 1.0, 1.06, 0.92, 1.14];
      let fi = 0;
      for (let dayOffset = 2; dayOffset <= 15; dayOffset++) {
        if (dayOffset % 5 === 0) continue; // a skipped day here and there
        const factor = factors[fi % factors.length];
        const seed = fi;
        fi++;
        const { data: log } = await admin
          .from("diet_logs")
          .insert({
            trainer_id: trainerId, client_id: cid, logged_on: daysAgo(dayOffset),
            water_ml: 1800 + ((seed * 240) % 1400),
            notes: seed % 4 === 0 ? "Felt good, trained fasted." : null,
            source: seed % 4 === 2 ? "client" : "trainer",
          })
          .select("id").single();
        const entries = buildLogEntries(style, seed, factor);
        await admin.from("diet_log_entries").insert(
          entries.map((e, pos) => ({
            trainer_id: trainerId, client_id: cid, log_id: log.id, position: pos,
            meal: e.meal, eaten_at: e.eaten_at, food: e.food, quantity: e.quantity,
            calories: e.calories, protein_g: e.protein_g, notes: null,
          })),
        );
        logCount++;
      }

      // Self-logging link
      if (cfg.logLink) {
        await admin.from("clients").update({
          log_token: randomBytes(24).toString("base64url"),
          log_token_created_at: new Date().toISOString(),
        }).eq("id", cid);
        logLinkCount++;
      }

      // Pending client submissions awaiting trainer review (today / yesterday)
      if (cfg.submissions) {
        const subRows = [];
        for (let s = 0; s < cfg.submissions; s++) {
          const entries = buildLogEntries(style, 20 + s, 1.0 + s * 0.05).map((e) => ({
            meal: e.meal, eaten_at: e.eaten_at, food: e.food, quantity: e.quantity,
            calories: e.calories, protein_g: e.protein_g, notes: "",
          }));
          subRows.push({
            trainer_id: trainerId, client_id: cid, logged_on: daysAgo(s),
            water_ml: 2000 + s * 300, notes: s === 0 ? "Logged from my phone 🙂" : null,
            entries,
          });
        }
        await admin.from("diet_log_submissions").insert(subRows);
        submissionCount += subRows.length;
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

  // Progress reports — shareable snapshots, with varied states (active / revoked
  // / expired / heavily viewed) so the reports list exercises every branch.
  let reportCount = 0;
  const reportRows = [];
  for (const cfg of CLIENTS) {
    if (!cfg.report) continue;
    const cid = idByName[cfg.full_name];
    const expired = cfg.report === "3m" && cfg.full_name === "Tanvi Desai";
    reportRows.push({
      trainer_id: trainerId, client_id: cid,
      token: randomBytes(24).toString("base64url"),
      title: `${cfg.full_name.split(" ")[0]}'s progress`,
      period: cfg.report,
      include_photos: !!cfg.photos,
      revoked: !!cfg.reportRevoked,
      view_count: cfg.reportRevoked ? 2 : expired ? 9 : Math.floor(Math.random() * 6),
      expires_at: expired
        ? new Date(Date.now() - 2 * 86400000).toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    reportCount++;
  }
  if (reportRows.length) await admin.from("progress_reports").insert(reportRows);

  // Subscription — put the demo trainer on the Pro plan so pro-gated features show.
  await admin.from("subscriptions").upsert({
    trainer_id: trainerId, plan: "pro", status: "active",
    current_end: new Date(Date.now() + 30 * 86400000).toISOString(),
  }, { onConflict: "trainer_id" });

  console.log(
    `\nSeeded ${CLIENTS.length} clients, ${photoCount} photos, ${planCount} diet plans, ` +
    `${logCount} diet logs, ${submissionCount} pending submissions, ${logLinkCount} self-logging links, ` +
    `${reportCount} progress reports, 5 reminders, 2 workout plans, 1 Pro subscription.`,
  );
  console.log(`\nSign in:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
