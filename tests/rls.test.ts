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

    const a = await authedClient(EMAIL_A);
    const { data, error } = await a
      .from("clients")
      .insert({ trainer_id: userA, full_name: "Client of A", consent_given: true })
      .select("id")
      .single();
    if (error) throw error;
    clientA = data!.id;

    const b = await authedClient(EMAIL_B);
    await b
      .from("clients")
      .insert({ trainer_id: userB, full_name: "Client of B", consent_given: true });
  }, 30000);

  afterAll(async () => {
    if (!admin) return;
    if (userA) await admin.auth.admin.deleteUser(userA);
    if (userB) await admin.auth.admin.deleteUser(userB);
  });

  it("each trainer sees only their own clients", async () => {
    const a = await authedClient(EMAIL_A);
    const { data } = await a.from("clients").select("full_name");
    expect(data).toHaveLength(1);
    expect(data![0].full_name).toBe("Client of A");
  });

  it("trainer B cannot read trainer A's client by id", async () => {
    const b = await authedClient(EMAIL_B);
    const { data } = await b.from("clients").select("*").eq("id", clientA);
    expect(data).toHaveLength(0);
  });

  it("trainer B cannot write data scoped to trainer A", async () => {
    const b = await authedClient(EMAIL_B);
    const { error } = await b
      .from("body_metrics")
      .insert({ trainer_id: userA, client_id: clientA, measured_on: "2026-01-01", weight_kg: 70 });
    // RLS WITH CHECK must reject a row owned by another trainer.
    expect(error).not.toBeNull();
  });
});
