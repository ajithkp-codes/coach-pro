// Promote (or demote) a trainer to platform admin by email.
// Usage: npm run make-admin -- you@example.com         (grant)
//        npm run make-admin -- you@example.com --off    (revoke)
// Requires migration 0008 applied.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const on = !process.argv.includes("--off");

if (!url || !service) {
  console.error("Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com [--off]");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });

const { data, error } = await admin
  .from("trainers")
  .update({ is_admin: on })
  .eq("email", email)
  .select("id, email, is_admin");

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
if (!data || data.length === 0) {
  console.error(`No trainer found with email ${email}. Make sure they have signed up.`);
  process.exit(1);
}
console.log(`${email} is_admin = ${data[0].is_admin}`);
