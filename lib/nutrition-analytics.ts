/**
 * Nutrition progress analytics — pure, client-safe derivations over the diet
 * logs and active plan the nutrition page already loads. No new tables: all of
 * it comes from `diet_logs` + `diet_log_entries` and the active `diet_plan`.
 */
import type { DietLogWithEntries, DietPlan } from "@/lib/types";
import { dayTotals, mealLabel, MEALS } from "@/lib/nutrition";
import { todayISO } from "@/lib/format";

const DAY = 86_400_000;

function at(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime();
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface DietStats {
  daysLogged30: number;
  daysLoggedPrev30: number;
  avgCalories: number | null;
  avgProtein: number | null;
  avgWater: number | null;
  lastLogged: string | null;
}

export function computeDietStats(logs: DietLogWithEntries[]): DietStats {
  const now = Date.now();
  let daysLogged30 = 0;
  let daysLoggedPrev30 = 0;
  let calSum = 0;
  let calDays = 0;
  let proSum = 0;
  let proDays = 0;
  let waterSum = 0;
  let waterDays = 0;
  let lastLogged: string | null = null;

  for (const log of logs) {
    const age = now - at(log.logged_on);
    const t = dayTotals(log.entries);
    if (age <= 30 * DAY) {
      daysLogged30++;
      if (t.calories > 0) {
        calSum += t.calories;
        calDays++;
      }
      if (t.protein > 0) {
        proSum += t.protein;
        proDays++;
      }
      if (log.water_ml != null) {
        waterSum += log.water_ml;
        waterDays++;
      }
    } else if (age <= 60 * DAY) {
      daysLoggedPrev30++;
    }
    if (!lastLogged || log.logged_on > lastLogged) lastLogged = log.logged_on;
  }

  return {
    daysLogged30,
    daysLoggedPrev30,
    avgCalories: calDays ? Math.round(calSum / calDays) : null,
    avgProtein: proDays ? Math.round(proSum / proDays) : null,
    avgWater: waterDays ? Math.round(waterSum / waterDays) : null,
    lastLogged,
  };
}

/** Calories per logged day over the trailing window (oldest first). */
export function calorieTrend(logs: DietLogWithEntries[], days = 30): TrendPoint[] {
  return metricTrend(logs, days, (l) => dayTotals(l.entries).calories);
}

/** Protein per logged day over the trailing window (oldest first). */
export function proteinTrend(logs: DietLogWithEntries[], days = 30): TrendPoint[] {
  return metricTrend(logs, days, (l) => dayTotals(l.entries).protein);
}

function metricTrend(
  logs: DietLogWithEntries[],
  days: number,
  value: (l: DietLogWithEntries) => number,
): TrendPoint[] {
  const cutoff = Date.now() - days * DAY;
  return logs
    .filter((l) => at(l.logged_on) >= cutoff)
    .map((l) => ({ date: l.logged_on, value: Math.round(value(l)) }))
    .filter((p) => p.value > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface MealShare {
  meal: string;
  calories: number;
  pct: number;
}

/** Where calories come from across the day, over the trailing window. */
export function mealBalance(logs: DietLogWithEntries[], days = 30): MealShare[] {
  const cutoff = Date.now() - days * DAY;
  const totals = new Map<string, number>();
  let total = 0;
  for (const log of logs) {
    if (at(log.logged_on) < cutoff) continue;
    for (const e of log.entries) {
      const cal = e.calories != null ? Number(e.calories) : 0;
      if (cal <= 0) continue;
      totals.set(e.meal, (totals.get(e.meal) ?? 0) + cal);
      total += cal;
    }
  }
  return MEALS.map((m) => m.value)
    .filter((m) => totals.has(m))
    .map((m) => {
      const calories = Math.round(totals.get(m) ?? 0);
      return { meal: mealLabel(m), calories, pct: total ? Math.round((calories / total) * 100) : 0 };
    });
}

export interface TargetAdherence {
  loggedDays: number;
  onTargetDays: number;
  pct: number;
}

/**
 * Share of logged days whose calories land within ±10% of the plan's daily
 * target. Null when there's no active calorie target to measure against.
 */
export function calorieAdherence(
  logs: DietLogWithEntries[],
  plan: DietPlan | null,
  days = 30,
): TargetAdherence | null {
  const target = plan?.target_calories;
  if (!target || target <= 0) return null;
  const cutoff = Date.now() - days * DAY;
  let loggedDays = 0;
  let onTargetDays = 0;
  for (const log of logs) {
    if (at(log.logged_on) < cutoff) continue;
    const cals = dayTotals(log.entries).calories;
    if (cals <= 0) continue;
    loggedDays++;
    if (cals >= target * 0.9 && cals <= target * 1.1) onTargetDays++;
  }
  if (loggedDays === 0) return null;
  return { loggedDays, onTargetDays, pct: Math.round((onTargetDays / loggedDays) * 100) };
}

export interface TodayIntake {
  calories: number;
  protein: number;
  water: number;
  logged: boolean;
}

/** Totals logged for the current day (empty when nothing is logged yet). */
export function todayIntake(logs: DietLogWithEntries[]): TodayIntake {
  const today = todayISO();
  const log = logs.find((l) => l.logged_on === today);
  if (!log) return { calories: 0, protein: 0, water: 0, logged: false };
  const t = dayTotals(log.entries);
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein),
    water: log.water_ml ?? 0,
    logged: true,
  };
}
