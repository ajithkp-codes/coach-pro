import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dietLogSchema } from "@/lib/validation";
import type { DietPlan, DietSubmission } from "@/lib/types";

export type LogLinkStatus = "ok" | "not_found";

/** What the public /log/<token> page needs — no trainer-only fields leak out. */
export interface LogLinkResolution {
  status: LogLinkStatus;
  clientId?: string;
  clientName?: string;
  businessName?: string | null;
  /** The active plan, trimmed to what helps a client self-log (name + targets + meals). */
  plan?: Pick<DietPlan, "name" | "target_calories" | "target_protein_g" | "days"> | null;
  /** The client's existing draft for today, if they already submitted one. */
  todaySubmission?: Pick<DietSubmission, "logged_on" | "water_ml" | "notes" | "entries"> | null;
}

/**
 * Resolve a per-client logging token WITHOUT authentication (the client isn't a
 * user). Uses the service role and returns only the safe fields the logging page
 * needs. The token being present and matching IS the credential.
 */
export async function resolveLogToken(token: string): Promise<LogLinkResolution> {
  if (!token) return { status: "not_found" };
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, trainer_id, full_name, status")
    .eq("log_token", token)
    .maybeSingle();

  if (!client || client.status === "archived") return { status: "not_found" };

  const today = new Date().toISOString().slice(0, 10);
  const [trainerRes, planRes, draftRes] = await Promise.all([
    admin.from("trainers").select("business_name, full_name").eq("id", client.trainer_id).maybeSingle(),
    admin
      .from("diet_plans")
      .select("name, target_calories, target_protein_g, days")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("diet_log_submissions")
      .select("logged_on, water_ml, notes, entries")
      .eq("client_id", client.id)
      .eq("logged_on", today)
      .maybeSingle(),
  ]);

  return {
    status: "ok",
    clientId: client.id as string,
    clientName: client.full_name as string,
    businessName: trainerRes.data?.business_name || trainerRes.data?.full_name || null,
    plan: (planRes.data as LogLinkResolution["plan"]) ?? null,
    todaySubmission: (draftRes.data as LogLinkResolution["todaySubmission"]) ?? null,
  };
}

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Accept a client's self-logged day into the review queue. Trainer/client scope
 * is taken from the resolved TOKEN, never from the submitted payload. One row per
 * (client, day): a re-submit for the same day replaces the earlier draft.
 */
export async function submitClientLog(token: string, input: unknown): Promise<SubmitResult> {
  const resolution = await resolveLogToken(token);
  if (resolution.status !== "ok" || !resolution.clientId) {
    return { ok: false, error: "This logging link is no longer active." };
  }

  const parsed = dietLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  }
  if (!parsed.data.entries.length) {
    return { ok: false, error: "Add at least one food before sending." };
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("trainer_id")
    .eq("id", resolution.clientId)
    .maybeSingle();
  if (!client) return { ok: false, error: "This logging link is no longer active." };

  const { error } = await admin
    .from("diet_log_submissions")
    .upsert(
      {
        trainer_id: client.trainer_id,
        client_id: resolution.clientId,
        logged_on: parsed.data.logged_on,
        water_ml: parsed.data.water_ml,
        notes: parsed.data.notes,
        entries: parsed.data.entries,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id,logged_on" },
    );
  if (error) {
    console.error("submitClientLog failed", error);
    return { ok: false, error: "Couldn't send your log. Please try again." };
  }
  return { ok: true };
}
