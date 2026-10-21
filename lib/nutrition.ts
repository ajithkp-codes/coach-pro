import type { DietLogEntry, DietPlanDay, MealType } from "@/lib/types";

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
