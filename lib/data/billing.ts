import { authed } from "./session";
import { DEMO_EMAIL, FREE_CLIENT_LIMIT, PRO_CLIENT_LIMIT } from "@/lib/constants";
import type { Plan, Subscription } from "@/lib/types";

/** The trainer's subscription row, or null (treated as free). */
export async function getSubscription(): Promise<Subscription | null> {
  const { supabase } = await authed();
  const { data } = await supabase.from("subscriptions").select("*").maybeSingle();
  return (data as Subscription) ?? null;
}

export function planOf(sub: Subscription | null): Plan {
  return sub && sub.plan === "pro" && sub.status === "active" ? "pro" : "free";
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
  const limit = plan === "pro" ? PRO_CLIENT_LIMIT : FREE_CLIENT_LIMIT;
  return { allowed: count < limit, plan, count, limit };
}
