/**
 * Compliance engine — turns "prescribed vs actual" into a single, honest number.
 *
 * CoachPro is one of the few trainer tools that holds BOTH the prescription
 * (active workout_plan / diet_plan) and the actuals (logged sessions, completed
 * appointments, diet logs), so it can compute real adherence instead of a vanity
 * percentage. These functions are pure so they can be unit-tested and so the
 * dashboard can batch-fetch once and compute for every client in memory.
 */

export interface ClientCompliance {
  /** Trained days ÷ planned training days this week (null = no active plan). */
  workoutPct: number | null;
  /** Days with a diet log this week ÷ 7 (null = no active diet plan). */
  nutritionPct: number | null;
  /** 0–100 overall score (average of the dimensions that apply). */
  score: number;
  trainedDays: number;
  plannedDays: number;
  loggedDays: number;
}

export interface ComplianceInput {
  /** Training days/week from the active workout plan (null = no active plan). */
  plannedDaysPerWeek: number | null;
  /** Whether the client has an active diet plan (expected to log intake). */
  hasDietPlan: boolean;
  /** Distinct days this week with a logged session OR a completed appointment. */
  trainedDaysThisWeek: number;
  /** Distinct days this week with a diet log or accepted submission. */
  loggedDaysThisWeek: number;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function computeCompliance(input: ComplianceInput): ClientCompliance {
  const { plannedDaysPerWeek, hasDietPlan, trainedDaysThisWeek, loggedDaysThisWeek } = input;

  const workoutPct =
    plannedDaysPerWeek && plannedDaysPerWeek > 0
      ? clampPct((trainedDaysThisWeek / plannedDaysPerWeek) * 100)
      : null;

  // A diet plan implies the client should be logging; expect ~daily (7/week).
  const nutritionPct = hasDietPlan ? clampPct((loggedDaysThisWeek / 7) * 100) : null;

  const parts = [workoutPct, nutritionPct].filter((p): p is number => p !== null);
  const score = parts.length
    ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    : 0;

  return {
    workoutPct,
    nutritionPct,
    score,
    trainedDays: trainedDaysThisWeek,
    plannedDays: plannedDaysPerWeek ?? 0,
    loggedDays: loggedDaysThisWeek,
  };
}

/** Risk tier derived from signals the churn research says precede cancellation. */
export type RiskTier = "on_track" | "watch" | "at_risk";

export interface RiskInput {
  consentMissing: boolean;
  /** Days since any session/diet log (null = never active). */
  daysSinceActivity: number | null;
  /** Logging frequency this week vs the client's own 4-week baseline, as a ratio. */
  loggingRatioVsBaseline: number | null;
  noCheckInThisWeek: boolean;
  markerOutOfRange: boolean;
  goalOverdue: boolean;
  /** Plan sessions the trainer marked missed this week. */
  missedThisWeek: number;
}

export interface RiskResult {
  tier: RiskTier;
  score: number;
  reasons: string[];
}

/**
 * Weighted engagement risk. Mirrors the retention research: the strongest signal
 * is a drop in logging frequency (≥30% vs baseline) and prolonged inactivity;
 * clinical/goal flags add weight but don't by themselves mean a client is leaving.
 */
export function computeRisk(input: RiskInput): RiskResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.daysSinceActivity === null) {
    score += 40;
    reasons.push("No activity logged yet");
  } else if (input.daysSinceActivity >= 21) {
    score += 50;
    reasons.push("Silent for 3+ weeks");
  } else if (input.daysSinceActivity >= 14) {
    score += 35;
    reasons.push("No activity in 2+ weeks");
  }

  if (input.loggingRatioVsBaseline !== null && input.loggingRatioVsBaseline <= 0.7) {
    score += 30;
    reasons.push("Logging has dropped sharply");
  }

  if (input.missedThisWeek > 0) {
    score += input.missedThisWeek >= 2 ? 30 : 15;
    reasons.push(
      input.missedThisWeek === 1
        ? "Missed a session this week"
        : `Missed ${input.missedThisWeek} sessions this week`,
    );
  }

  if (input.noCheckInThisWeek) {
    score += 10;
    reasons.push("No check-in this week");
  }
  if (input.markerOutOfRange) {
    score += 15;
    reasons.push("Health marker out of range");
  }
  if (input.goalOverdue) {
    score += 10;
    reasons.push("Goal overdue");
  }
  if (input.consentMissing) {
    score += 10;
    reasons.push("Consent not recorded");
  }

  const tier: RiskTier = score >= 50 ? "at_risk" : score >= 25 ? "watch" : "on_track";
  return { tier, score, reasons };
}
