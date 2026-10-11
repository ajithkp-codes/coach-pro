import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan, SubStatus } from "@/lib/types";

/** Service-role writes to subscriptions (trainers can't write their own row). */
export async function upsertSubscription(
  trainerId: string,
  fields: Partial<{
    plan: Plan;
    status: SubStatus;
    razorpay_customer_id: string | null;
    razorpay_subscription_id: string | null;
    current_end: string | null;
  }>,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .upsert({ trainer_id: trainerId, ...fields }, { onConflict: "trainer_id" });
  if (error) throw error;
}

export async function trainerByRazorpaySubscription(
  subscriptionId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("trainer_id")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();
  return (data?.trainer_id as string) ?? null;
}
