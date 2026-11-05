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
  label: "Launch offer: 50% off",
} as const;

export interface PlanTier {
  key: Plan;
  label: string;
  /** Ordering of the ladder: free 0, pro 1, studio 2. */
  rank: number;
  /** Regular monthly price in INR (before any promo). 0 for Free. */
  priceInr: number;
  /**
   * Exact monthly price in INR while the launch promo runs (what the matching
   * Razorpay plan actually charges). Set per-tier rather than derived by
   * percentage so the displayed price is exact (e.g. ₹499, not round(999×0.5)).
   */
  promoPriceInr?: number;
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
    promoPriceInr: 499,
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
    promoPriceInr: 749,
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

/* ------------------------------------------------------------------ *
 * Free trial
 *
 * Every new trainer gets a time-limited trial of a paid tier, derived
 * purely from when their account was created — no trial columns, no cron.
 * While the window is open and they have no decided subscription, they are
 * entitled to TRIAL_PLAN's features; afterwards they fall back to Free.
 * Subscribing supersedes the trial (they get the paid tier); cancelling ends
 * it (they drop to Free and the trial does not come back).
 * ------------------------------------------------------------------ */

/** Length of the new-trainer free trial, in days. */
export const TRIAL_DAYS = 30;

/** The tier a trial grants. */
export const TRIAL_PLAN: Plan = "pro";

const DAY_MS = 24 * 60 * 60 * 1000;

/** When a trainer's trial ends, given their account creation timestamp. */
export function trialEndsAt(createdAt: string | Date): Date {
  return new Date(new Date(createdAt).getTime() + TRIAL_DAYS * DAY_MS);
}

/**
 * Is this trainer currently within their free trial? True only when they have
 * no active paid plan, have not cancelled or lapsed a paid plan, and the
 * creation-based window is still open. A null/undefined status means no
 * subscription row exists yet (never touched billing) — eligible. A pending
 * 'inactive' row (started an upgrade but didn't pay) stays eligible.
 */
export function isOnTrial(
  plan: Plan | null | undefined,
  status: string | null | undefined,
  createdAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (effectivePlan(plan, status) !== "free") return false; // active paid plan
  if (status === "cancelled" || status === "past_due") return false; // had/ended a paid plan
  if (!createdAt) return false;
  return now < trialEndsAt(createdAt);
}

/** Days left in the trial (0 once expired), for display. */
export function trialDaysLeft(createdAt: string | Date, now: Date = new Date()): number {
  const ms = trialEndsAt(createdAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / DAY_MS);
}

/**
 * The plan whose FEATURES a trainer is entitled to right now — trial-aware.
 * This is what feature gates (client caps, AI generation) should read.
 * Distinct from effectivePlan, which reflects only a *paid* subscription and
 * is what revenue/admin should read (a trial is not revenue).
 */
export function entitlementPlan(
  plan: Plan | null | undefined,
  status: string | null | undefined,
  createdAt: string | Date | null | undefined,
  now: Date = new Date(),
): Plan {
  if (isOnTrial(plan, status, createdAt, now)) return TRIAL_PLAN;
  return effectivePlan(plan, status);
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
  const tier = getTier(plan);
  if (!tier.priceInr || !LAUNCH_PROMO.active) return tier.priceInr;
  // Prefer the explicit promo price (matches the Razorpay plan); otherwise fall
  // back to the percentage.
  return tier.promoPriceInr ?? Math.round(tier.priceInr * (1 - LAUNCH_PROMO.percentOff / 100));
}

/**
 * Indicative INR→USD rate for showing an approximate dollar price alongside the
 * INR price on marketing/billing surfaces. Display-only — billing is in INR via
 * Razorpay. Rounded to a whole dollar.
 */
export const USD_PER_INR = 1 / 88;

/** Approximate USD price for an INR amount, rounded to a whole dollar. */
export function usdFromInr(inr: number): number {
  return Math.round(inr * USD_PER_INR);
}

/** Resolve a paid tier's Razorpay plan id from the environment, if configured. */
export function razorpayPlanIdFor(plan: Plan): string | undefined {
  const env = getTier(plan).razorpayPlanEnv;
  if (!env) return undefined;
  // Pro falls back to the legacy single-plan env for backward compatibility.
  return process.env[env] || (plan === "pro" ? process.env.RAZORPAY_PLAN_ID : undefined) || undefined;
}
