import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkoutPlan } from "@/lib/types";

/**
 * Resolve a workout-plan share token WITHOUT authentication (the client isn't a
 * user). Uses the service-role client, so the random token is the capability —
 * exactly the model progress-report sharing uses (lib/data/report-public.ts).
 */

export type PlanShareOutcome = "ok" | "not_found" | "revoked";

export interface PlanShareData {
  plan: WorkoutPlan;
  clientName: string;
  businessName: string | null;
}

export async function resolvePlanShare(
  token: string,
): Promise<{ status: PlanShareOutcome; data?: PlanShareData }> {
  if (!token) return { status: "not_found" };
  const admin = createAdminClient();

  const { data } = await admin
    .from("workout_plans")
    .select("*")
    .eq("share_token", token)
    .maybeSingle();
  if (!data) return { status: "not_found" };

  const plan = data as WorkoutPlan;
  if (plan.share_revoked) return { status: "revoked" };

  const [clientRes, trainerRes] = await Promise.all([
    admin.from("clients").select("full_name").eq("id", plan.client_id).maybeSingle(),
    admin.from("trainers").select("business_name, full_name").eq("id", plan.trainer_id).maybeSingle(),
  ]);

  return {
    status: "ok",
    data: {
      plan,
      clientName: (clientRes.data?.full_name as string) ?? "Client",
      businessName:
        (trainerRes.data?.business_name as string | null) ||
        (trainerRes.data?.full_name as string | null) ||
        null,
    },
  };
}

/** Best-effort view counter bump; never throws (a failed count must not break the page). */
export async function recordPlanView(id: string, current: number): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("workout_plans").update({ share_view_count: current + 1 }).eq("id", id);
  } catch {
    // ignore — the view is cosmetic
  }
}
