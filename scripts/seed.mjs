// Seed a demo trainer with sample clients and data.
// Usage: npm run seed   (reads keys from .env.local)
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// and migration 0001 applied.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@coachpro.app";
const DEMO_PASSWORD = "coachpro-demo-123";

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateTrainer() {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo Trainer", business_name: "CoachPro Demo Studio" },
  });
  if (!error) return data.user.id;

  // Already exists — find the id by listing.
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === DEMO_EMAIL);
  if (!existing) throw error;
  return existing.id;
}

async function main() {
  const trainerId = await getOrCreateTrainer();
  // Ensure the trainer profile row exists (the signup trigger only fires for new
  // users; a demo user created before the trigger existed would be missing it).
  await admin.from("trainers").upsert({
    id: trainerId,
    full_name: "Demo Trainer",
    business_name: "CoachPro Demo Studio",
    email: DEMO_EMAIL,
  });
  console.log(`Trainer ready: ${DEMO_EMAIL} (${trainerId})`);

  // Clear any previous demo clients (cascades to their data).
  await admin.from("clients").delete().eq("trainer_id", trainerId);

  const { data: clients, error: cErr } = await admin
    .from("clients")
    .insert([
      {
        trainer_id: trainerId,
        full_name: "Aarav Sharma",
        sex: "male",
        date_of_birth: "1990-05-12",
        phone: "+91 98765 43210",
        notes: "Training for a half marathon. Watching cholesterol.",
        consent_given: true,
        consent_at: new Date().toISOString(),
      },
      {
        trainer_id: trainerId,
        full_name: "Priya Nair",
        sex: "female",
        date_of_birth: "1995-11-03",
        notes: "Strength + fat loss. Pre-diabetic range, monitoring glucose.",
        consent_given: true,
        consent_at: new Date().toISOString(),
      },
    ])
    .select("id, full_name");
  if (cErr) throw cErr;

  const aarav = clients.find((c) => c.full_name.startsWith("Aarav")).id;
  const priya = clients.find((c) => c.full_name.startsWith("Priya")).id;

  // Body metrics — a downward weight trend over ~3 months.
  const metrics = [];
  const weights = [84, 83.1, 82.4, 81.2, 80.5, 79.3];
  weights.forEach((w, i) => {
    metrics.push({
      trainer_id: trainerId,
      client_id: aarav,
      measured_on: daysAgo((weights.length - 1 - i) * 15),
      weight_kg: w,
      height_cm: 178,
      body_fat_pct: 22 - i * 0.6,
      waist_cm: 92 - i,
    });
  });
  const priyaWeights = [68, 67.4, 67.1, 66.3, 65.8];
  priyaWeights.forEach((w, i) => {
    metrics.push({
      trainer_id: trainerId,
      client_id: priya,
      measured_on: daysAgo((priyaWeights.length - 1 - i) * 18),
      weight_kg: w,
      height_cm: 162,
      body_fat_pct: 30 - i * 0.5,
      waist_cm: 78 - i * 0.8,
    });
  });
  await admin.from("body_metrics").insert(metrics);

  // Health markers.
  const markers = [];
  [210, 205, 198, 192].forEach((v, i) =>
    markers.push({
      trainer_id: trainerId,
      client_id: aarav,
      measured_on: daysAgo((3 - i) * 20),
      marker_key: "total_cholesterol",
      value: v,
      unit: "mg/dL",
    }),
  );
  [118, 112, 106, 99].forEach((v, i) =>
    markers.push({
      trainer_id: trainerId,
      client_id: priya,
      measured_on: daysAgo((3 - i) * 20),
      marker_key: "fasting_glucose",
      value: v,
      unit: "mg/dL",
    }),
  );
  await admin.from("health_markers").insert(markers);

  // Goals.
  await admin.from("goals").insert([
    {
      trainer_id: trainerId,
      client_id: aarav,
      title: "Reach 77 kg",
      category: "health",
      metric_key: "weight_kg",
      start_value: 84,
      target_value: 77,
      target_unit: "kg",
      target_date: daysAgo(-45),
      status: "active",
    },
    {
      trainer_id: trainerId,
      client_id: priya,
      title: "Fasting glucose under 95",
      category: "health",
      metric_key: "fasting_glucose",
      start_value: 118,
      target_value: 95,
      target_unit: "mg/dL",
      status: "active",
    },
  ]);

  console.log("Seeded 2 clients with metrics, markers, and goals.");
  console.log(`\nSign in with:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
