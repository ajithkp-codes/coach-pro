import type { Plan } from "@/lib/types";

/**
 * The single source of truth for CoachPro's subscription tiers: prices, client
 * caps, feature entitlements and the Razorpay plan each maps to. Everything that
 * needs to reason about plans — billing page, client caps, AI gating, admin
 * revenue — reads from here so the ladder stays consistent.
 */

/** A launch discount applied to every paid tier's displayed & billed price. */
export const LAUNCH_PROMO = {
  active: true,
  percentOff: 50,
  /** Shown on the billing page while the promo runs. */
  label: "Launch offer — 50% off",
} as const;

export interface PlanTier {
  key: Plan;
  label: string;
  /** Ordering of the ladder: free 0, pro 1, studio 2. */
  rank: number;
  /** Regular monthly price in INR (before any promo). 0 for Free. */
  priceInr: number;
  /** Max active clients; null = unlimited. */
  clientLimit: number | null;
  /** May this tier use AI plan generation? */
  aiGeneration: boolean;
  /** Daily cap on app-billed AI calls for this tier. */
  aiDailyLimit: number;
  tagline: string;
  features: string[];
  /** Env var holding this tier's Razorpay plan id (paid tiers only). */
  razorpayPlanEnv?: string;
}

export const PLAN_CATALOG: Record<Plan, PlanTier> = {
  free: {
    key: "free",
    label: "Free",
    rank: 0,
    priceInr: 0,
    clientLimit: 5,
    aiGeneration: false,
    aiDailyLimit: 0,
    tagline: "Everything you need to coach your first clients.",
    features: [
      "Up to 5 active clients",
      "Body metrics, markers & goals",
      "Manual training & nutrition plans",
      "Charts, progress photos & file sharing",
      "Client share links & reminders",
    ],
  },
  pro: {
    key: "pro",
    label: "Pro",
    rank: 1,
    priceInr: 999,
    clientLimit: 15,
    aiGeneration: true,
    aiDailyLimit: 50,
    tagline: "AI-assisted programming for a growing roster.",
    features: [
      "Up to 15 active clients",
      "Everything in Free",
      "AI workout plan generation",
      "Priority support",
    ],
    razorpayPlanEnv: "RAZORPAY_PLAN_ID_PRO",
  },
  studio: {
    key: "studio",
    label: "Studio",
    rank: 2,
    priceInr: 1499,
    clientLimit: null,
    aiGeneration: true,
    aiDailyLimit: 200,
    tagline: "For full-time coaches and studios at scale.",
    features: [
      "Unlimited active clients",
      "Everything in Pro",
      "Higher daily AI generation limit",
      "Priority support",
    ],
    razorpayPlanEnv: "RAZORPAY_PLAN_ID_STUDIO",
  },
};

/** All tiers in ladder order. */
export const PLAN_TIERS: PlanTier[] = Object.values(PLAN_CATALOG).sort((a, b) => a.rank - b.rank);

/** The paid tiers, in ladder order (Pro, Studio). */
export const PAID_TIERS: PlanTier[] = PLAN_TIERS.filter((t) => t.priceInr > 0);

export function getTier(plan: Plan): PlanTier {
  return PLAN_CATALOG[plan] ?? PLAN_CATALOG.free;
}

export function isPaidPlan(plan: Plan): boolean {
  return getTier(plan).priceInr > 0;
}

/**
 * Normalize a stored (plan, status) pair to the effective entitlement plan: a
 * paid plan only counts while its subscription is `active`, otherwise Free.
 */
export function effectivePlan(
  plan: Plan | null | undefined,
  status: string | null | undefined,
): Plan {
  if ((plan === "pro" || plan === "studio") && status === "active") return plan;
  return "free";
}

export function clientLimitFor(plan: Plan): number | null {
  return getTier(plan).clientLimit;
}

export function canGenerateAi(plan: Plan): boolean {
  return getTier(plan).aiGeneration;
}

export function aiDailyLimitFor(plan: Plan): number {
  return getTier(plan).aiDailyLimit;
}

/** The price actually displayed and billed (promo applied while it runs). */
export function effectiveMonthlyPriceInr(plan: Plan): number {
  const full = getTier(plan).priceInr;
  if (!full || !LAUNCH_PROMO.active) return full;
  return Math.round(full * (1 - LAUNCH_PROMO.percentOff / 100));
}

/** Resolve a paid tier's Razorpay plan id from the environment, if configured. */
export function razorpayPlanIdFor(plan: Plan): string | undefined {
  const env = getTier(plan).razorpayPlanEnv;
  if (!env) return undefined;
  // Pro falls back to the legacy single-plan env for backward compatibility.
  return process.env[env] || (plan === "pro" ? process.env.RAZORPAY_PLAN_ID : undefined) || undefined;
}
