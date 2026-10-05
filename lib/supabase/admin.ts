import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client, BYPASSES Row-Level Security.
 * SERVER ONLY. Use strictly for seeding, migrations, and trusted admin tasks,
 * never in response to untrusted input without manual trainer_id scoping.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
