/**
 * Plan-derived scheduling — the active workout plan IS the schedule.
 *
 * A trainer builds each client's plan once, tagging days by weekday (Mon…Sun).
 * The daily/weekly roster falls out of that automatically: no separate calendar
 * to maintain, no double entry. These helpers are pure so the dashboard and the
 * schedule page can compute the roster in memory from the plans they already load.
 */
import type { PlanDay, WorkoutPlan } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Local yyyy-mm-dd for a Date. */
export function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The 3-letter weekday label for a yyyy-mm-dd date (local). */
export function weekdayLabel(dateISO: string): string {
  return WEEKDAYS[new Date(`${dateISO}T00:00:00`).getDay()];
}

/** Does a plan day's label fall on the given date? Weekday match, or "every day". */
export function dayMatchesDate(dayLabel: string, dateISO: string): boolean {
  const norm = dayLabel.trim().toLowerCase();
  if (norm === "every day" || norm === "everyday" || norm === "daily") return true;
  return norm.slice(0, 3) === weekdayLabel(dateISO).toLowerCase();
}

export interface ExpectedDay {
  planId: string;
  dayIndex: number;
  day: PlanDay;
}

/**
 * The plan day a client is expected to train on `dateISO`, from their active
 * plan. Only non-empty days with a weekday that matches count; null = nothing
 * scheduled that day (or the plan uses non-weekday labels like "Day 1").
 */
export function expectedDayOn(
  activePlan: WorkoutPlan | null | undefined,
  dateISO: string,
): ExpectedDay | null {
  if (!activePlan) return null;
  for (let i = 0; i < activePlan.days.length; i++) {
    const day = activePlan.days[i];
    if (day.items.length > 0 && dayMatchesDate(day.day, dateISO)) {
      return { planId: activePlan.id, dayIndex: i, day };
    }
  }
  return null;
}

/** How many weekday-tagged training days an active plan schedules per week. */
export function scheduledDaysPerWeek(activePlan: WorkoutPlan | null | undefined): number {
  if (!activePlan) return 0;
  return activePlan.days.filter(
    (d) => d.items.length > 0 && (dayIsWeekday(d.day) || isEveryDay(d.day)),
  ).length;
}

function isEveryDay(label: string): boolean {
  const n = label.trim().toLowerCase();
  return n === "every day" || n === "everyday" || n === "daily";
}

function dayIsWeekday(label: string): boolean {
  const n = label.trim().toLowerCase().slice(0, 3);
  return WEEKDAYS.some((w) => w.toLowerCase() === n);
}
