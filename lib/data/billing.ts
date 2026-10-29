import { authed } from "./session";
import { DEMO_EMAIL } from "@/lib/constants";
import { clientLimitFor, effectivePlan } from "@/lib/catalog/plans";
import type { Plan, Subscription } from "@/lib/types";

/** The trainer's subscription row, or null (treated as free). */
export async function getSubscription(): Promise<Subscription | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("subscriptions").select("*").maybeSingle();
  return (data as Subscription) ?? null;
}

export function planOf(sub: Subscription | null): Plan {
  return effectivePlan(sub?.plan, sub?.status);
}

/** Whether the trainer can add another client under their plan. */
export async function canAddClient(): Promise<{
  allowed: boolean;
  plan: Plan;
  count: number;
  limit: number | null;
}> {
  const { supabase, email } = await authed();
  const [sub, countRes] = await Promise.all([
    getSubscription(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const plan = planOf(sub);
  const count = countRes.count ?? 0;
  // The demo/showcase account is exempt from plan caps (unlimited). A null limit
  // is treated as "unlimited" everywhere downstream (add-client + bulk import).
  if (email === DEMO_EMAIL) {
    return { allowed: true, plan, count, limit: null };
  }
  const limit = clientLimitFor(plan);
  // A null limit means unlimited (e.g. Studio), same as the demo account.
  if (limit === null) {
    return { allowed: true, plan, count, limit: null };
  }
  return { allowed: count < limit, plan, count, limit };
}
