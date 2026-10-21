import type { DietLogEntry, DietLogWithEntries, DietPlan, DietPlanDay, MealType } from "@/lib/types";

/** Display order + labels for meal types. */
export const MEALS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "snack", label: "Snack" },
  { value: "dinner", label: "Dinner" },
  { value: "other", label: "Other" },
];

export function mealLabel(m: MealType): string {
  return MEALS.find((x) => x.value === m)?.label ?? "Other";
}

/** Calorie + protein totals for a day's entries (missing numbers count as 0). */
export function dayTotals(entries: Pick<DietLogEntry, "calories" | "protein_g">[]) {
  return entries.reduce(
    (t, e) => ({
      calories: t.calories + (e.calories != null ? Number(e.calories) : 0),
      protein: t.protein + (e.protein_g != null ? Number(e.protein_g) : 0),
    }),
    { calories: 0, protein: 0 },
  );
}

/** First number in a free-text value ("~250", "18g") or 0. */
export function leadingNumber(s: string | null | undefined): number {
  const m = (s ?? "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

/** Approximate totals for one planned day (plan numbers are free text). */
export function planDayTotals(day: DietPlanDay) {
  let calories = 0;
  let protein = 0;
  for (const m of day.meals) {
    for (const it of m.items) {
      calories += leadingNumber(it.calories);
      protein += leadingNumber(it.protein);
    }
  }
  return { calories: Math.round(calories), protein: Math.round(protein) };
}

/** Sort key so entries/meals render in a day's natural order. */
export function mealOrder(m: MealType): number {
  const i = MEALS.findIndex((x) => x.value === m);
  return i === -1 ? MEALS.length : i;
}

export type AdherenceTone = "success" | "warning" | "info" | "neutral";

/**
 * How a logged value compares to a daily target:
 *  - within 10% over (or above 90% of) target reads as on-plan (success),
 *  - well over is a warning, under is info, no target is neutral.
 */
export function adherenceTone(
  value: number,
  target: number | null | undefined,
): AdherenceTone {
  if (target == null || target <= 0) return "neutral";
  const pct = value / target;
  if (pct > 1.1) return "warning";
  if (pct >= 0.9) return "success";
  return "info";
}

// ---- In-app nudges: adherence suggestions the trainer can turn into reminders ----

/** A suggested follow-up computed from a client's logs — never sent anywhere. */
export interface NutritionNudge {
  key: string;
  /** Ready-to-use reminder title (one-tap "Add reminder"). */
  title: string;
  /** What the trainer sees explaining the nudge. */
  detail: string;
  tone: "warning" | "info";
  icon: string;
}

/** Whole days between two ISO dates (yyyy-mm-dd). */
function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00Z`).getTime();
  const b = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Suggest nutrition follow-ups from recent logs. Only fires when the client is
 * being coached on diet (an active plan exists). Stays entirely in-app: the
 * trainer decides whether to turn each one into a reminder.
 */
export function computeNutritionNudges(opts: {
  today: string;
  clientName: string;
  activePlan: Pick<DietPlan, "target_calories" | "target_protein_g"> | null;
  logs: DietLogWithEntries[]; // newest day first
}): NutritionNudge[] {
  const { today, clientName, activePlan, logs } = opts;
  if (!activePlan) return [];

  const name = clientName.split(" ")[0] || clientName;
  const nudges: NutritionNudge[] = [];

  // 1) Stale / absent logging.
  if (!logs.length) {
    nudges.push({
      key: "no-logs",
      title: `Ask ${name} to start logging meals`,
      detail: "No food has been logged yet against the active plan.",
      tone: "info",
      icon: "utensils",
    });
  } else {
    const daysSince = daysBetween(logs[0].logged_on, today);
    if (daysSince >= 3) {
      nudges.push({
        key: "stale-log",
        title: `Nudge ${name} to log meals`,
        detail: `No food logged in ${daysSince} days (last on ${logs[0].logged_on}).`,
        tone: "warning",
        icon: "clock",
      });
    }
  }

  // Recent logged days (up to 5) for average-based nudges.
  const recent = logs.slice(0, 5).map((l) => dayTotals(l.entries));

  // 2) Consistently over the calorie target.
  if (activePlan.target_calories) {
    const withCals = recent.filter((t) => t.calories > 0);
    if (withCals.length >= 3) {
      const avg = withCals.reduce((s, t) => s + t.calories, 0) / withCals.length;
      if (avg > activePlan.target_calories * 1.1) {
        nudges.push({
          key: "over-calories",
          title: `Check in with ${name} on portions`,
          detail: `Averaging ${Math.round(avg)} kcal over the last ${withCals.length} logged days vs a ${activePlan.target_calories} kcal target.`,
          tone: "warning",
          icon: "flame",
        });
      }
    }
  }

  // 3) Consistently under the protein target.
  if (activePlan.target_protein_g) {
    const withProtein = recent.filter((t) => t.protein > 0);
    if (withProtein.length >= 3) {
      const avg = withProtein.reduce((s, t) => s + t.protein, 0) / withProtein.length;
      if (avg < activePlan.target_protein_g * 0.8) {
        nudges.push({
          key: "low-protein",
          title: `Remind ${name} to hit protein`,
          detail: `Protein averaging ${Math.round(avg)} g over the last ${withProtein.length} logged days vs a ${activePlan.target_protein_g} g target.`,
          tone: "info",
          icon: "target",
        });
      }
    }
  }

  return nudges;
}
