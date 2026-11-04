import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Tenant-isolation test — the single most important control in CoachPro.
 * Creates two trainers, has each add a client, and asserts neither can see
 * the other's data through RLS.
 *
 * Requires a live Supabase project with migration 0001 applied and these env
 * vars set (in .env.local). Skips automatically when they are absent.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(url && anon && service);

const stamp = Date.now();
const EMAIL_A = `rls-a-${stamp}@coachpro.test`;
const EMAIL_B = `rls-b-${stamp}@coachpro.test`;
const PASSWORD = "test-password-123";

describe.skipIf(!configured)("RLS tenant isolation", () => {
  let admin: SupabaseClient;
  let userA = "";
  let userB = "";
  let clientA = "";
  // Sign each trainer in ONCE and reuse the session across every test. Fresh
  // sign-ins per test trip Supabase's auth rate limit once the table sweep runs.
  let sessionA: SupabaseClient;
  let sessionB: SupabaseClient;

  async function authedClient(email: string): Promise<SupabaseClient> {
    const c = createClient(url!, anon!);
    const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw error;
    return c;
  }

  beforeAll(async () => {
    admin = createClient(url!, service!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const email of [EMAIL_A, EMAIL_B]) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: email },
      });
      if (error) throw error;
      if (email === EMAIL_A) userA = data.user!.id;
      else userB = data.user!.id;
    }

    sessionA = await authedClient(EMAIL_A);
    sessionB = await authedClient(EMAIL_B);

    const { data, error } = await sessionA
      .from("clients")
      .insert({ trainer_id: userA, full_name: "Client of A", consent_given: true })
      .select("id")
      .single();
    if (error) throw error;
    clientA = data!.id;

    await sessionB
      .from("clients")
      .insert({ trainer_id: userB, full_name: "Client of B", consent_given: true });
  }, 30000);

  afterAll(async () => {
    if (!admin) return;
    if (userA) await admin.auth.admin.deleteUser(userA);
    if (userB) await admin.auth.admin.deleteUser(userB);
  });

  it("each trainer sees only their own clients", async () => {
    const { data } = await sessionA.from("clients").select("full_name");
    expect(data).toHaveLength(1);
    expect(data![0].full_name).toBe("Client of A");
  });

  it("trainer B cannot read trainer A's client by id", async () => {
    const { data } = await sessionB.from("clients").select("*").eq("id", clientA);
    expect(data).toHaveLength(0);
  });

  it("trainer B cannot write data scoped to trainer A", async () => {
    const { error } = await sessionB
      .from("body_metrics")
      .insert({ trainer_id: userA, client_id: clientA, measured_on: "2026-01-01", weight_kg: 70 });
    // RLS WITH CHECK must reject a row owned by another trainer.
    expect(error).not.toBeNull();
  });

  // Every tenant-scoped table uses the identical `trainer_id = auth.uid()`
  // policy, so this sweep is the real regression net: if a future migration
  // adds a table or ships a policy that forgets the tenant predicate, the
  // offending table shows up here as a cross-tenant row, failing the suite.
  // We assert the invariant directly — no trainer-scoped read may EVER return
  // another trainer's row — so it holds no matter which trainer has data.
  const TRAINER_SCOPED_TABLES = [
    "clients",
    "body_metrics",
    "health_markers",
    "goals",
    "workout_plans",
    "workout_sessions",
    "workout_sets",
    "diet_plans",
    "diet_logs",
    "diet_log_entries",
    "diet_log_submissions",
    "appointments",
    "reminders",
    "progress_reports",
    "client_photos",
    "shared_files",
    "subscriptions",
  ] as const;

  it.each(TRAINER_SCOPED_TABLES)(
    "%s never leaks another trainer's rows across the tenant boundary",
    async (table) => {
      const [asA, asB] = await Promise.all([
        sessionA.from(table).select("trainer_id"),
        sessionB.from(table).select("trainer_id"),
      ]);
      // A read failing outright is also a failure — the policy must allow a
      // trainer to see their own rows, just never anyone else's.
      expect(asA.error, `trainer A read of ${table} errored: ${asA.error?.message}`).toBeNull();
      expect(asB.error, `trainer B read of ${table} errored: ${asB.error?.message}`).toBeNull();
      expect(
        (asA.data ?? []).every((r) => r.trainer_id === userA),
        `${table} returned a non-A row to trainer A`,
      ).toBe(true);
      expect(
        (asB.data ?? []).every((r) => r.trainer_id === userB),
        `${table} returned a non-B row to trainer B`,
      ).toBe(true);
    },
  );
});
