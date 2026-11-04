import { authed } from "./session";
import { DEMO_EMAIL } from "@/lib/constants";
import {
  clientLimitFor,
  effectivePlan,
  entitlementPlan,
  isOnTrial,
  trialDaysLeft,
  trialEndsAt,
} from "@/lib/catalog/plans";
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

export interface Entitlement {
  /** Plan whose features apply now (trial-aware). Use this for feature gating. */
  plan: Plan;
  /** True while the free trial is active. */
  isTrial: boolean;
  /** Days remaining in the trial (0 when not trialing). */
  trialDaysLeft: number;
  /** When the trial ends (null when not trialing). */
  trialEndsAt: string | null;
}

/**
 * The trainer's current entitlement, trial-aware. During the 30-day new-trainer
 * trial this reports {@link TRIAL_PLAN}'s features; afterwards it reflects their
 * actual (paid or free) plan. This is the source of truth for feature gates.
 */
export async function getEntitlement(): Promise<Entitlement> {
  const { supabase } = await authed();
  const [subRes, trainerRes] = await Promise.all([
    supabase.from("subscriptions").select("*").maybeSingle(),
    supabase.from("trainers").select("created_at").maybeSingle(),
  ]);
  const sub = (subRes.data as Subscription) ?? null;
  const createdAt = (trainerRes.data as { created_at: string } | null)?.created_at ?? null;
  const trial = isOnTrial(sub?.plan, sub?.status, createdAt);
  return {
    plan: entitlementPlan(sub?.plan, sub?.status, createdAt),
    isTrial: trial,
    trialDaysLeft: trial && createdAt ? trialDaysLeft(createdAt) : 0,
    trialEndsAt: trial && createdAt ? trialEndsAt(createdAt).toISOString() : null,
  };
}

/** Whether the trainer can add another client under their plan. */
export async function canAddClient(): Promise<{
  allowed: boolean;
  plan: Plan;
  count: number;
  limit: number | null;
}> {
  const { supabase, email } = await authed();
  const [sub, trainerRes, countRes] = await Promise.all([
    getSubscription(),
    supabase.from("trainers").select("created_at").maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  const createdAt = (trainerRes.data as { created_at: string } | null)?.created_at ?? null;
  // Trial-aware: during the 30-day trial the trainer gets the trial tier's cap.
  const plan = entitlementPlan(sub?.plan, sub?.status, createdAt);
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
