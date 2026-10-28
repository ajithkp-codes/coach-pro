/**
 * Training progress analytics — pure, client-safe derivations over the
 * sessions and plans the training page already loads. No server access, no new
 * tables: everything here is computed from `workout_sessions` + `workout_sets`
 * and the active `workout_plan`.
 */
import type { WorkoutSessionWithSets, WorkoutPlan, PlanDay } from "@/lib/types";
import { GROUP_BY_EXERCISE } from "@/lib/catalog/exercises";
import { MODALITIES, type Modality } from "@/lib/catalog/modalities";
import { expectedDayOn, localDateISO } from "@/lib/roster";

const DAY = 86_400_000;

function setVolume(reps: number | null, weight: number | null): number {
  return reps != null && weight != null ? Number(reps) * Number(weight) : 0;
}

/** Epley estimated 1-rep max; falls back to the raw weight when reps are absent. */
function est1rm(weight: number, reps: number | null): number {
  const r = reps && reps > 0 ? reps : 1;
  return weight * (1 + r / 30);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Monday 00:00 of the week containing `d` (local time). */
function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - shift);
  return x;
}

export interface TrainingStats {
  totalSessions: number;
  sessions30: number;
  sessionsPrev30: number;
  volume30: number;
  volumePrev30: number;
  avgDuration: number | null;
  lastPerformed: string | null;
}

export function computeStats(sessions: WorkoutSessionWithSets[]): TrainingStats {
  const now = Date.now();
  let sessions30 = 0;
  let sessionsPrev30 = 0;
  let volume30 = 0;
  let volumePrev30 = 0;
  let durSum = 0;
  let durCount = 0;
  let lastPerformed: string | null = null;

  for (const s of sessions) {
    const t = new Date(`${s.performed_on}T00:00:00`).getTime();
    const age = now - t;
    const vol = s.sets.reduce((sum, x) => sum + setVolume(x.reps, x.weight_kg), 0);
    if (age <= 30 * DAY) {
      sessions30++;
      volume30 += vol;
    } else if (age <= 60 * DAY) {
      sessionsPrev30++;
      volumePrev30 += vol;
    }
    if (s.duration_min != null) {
      durSum += s.duration_min;
      durCount++;
    }
    if (!lastPerformed || s.performed_on > lastPerformed) lastPerformed = s.performed_on;
  }

  return {
    totalSessions: sessions.length,
    sessions30,
    sessionsPrev30,
    volume30: Math.round(volume30),
    volumePrev30: Math.round(volumePrev30),
    avgDuration: durCount ? Math.round(durSum / durCount) : null,
    lastPerformed,
  };
}

export interface TrendPoint {
  date: string;
  value: number;
}

/** Total training volume per week for the trailing `weeks` weeks (oldest first). */
export function weeklyVolume(
  sessions: WorkoutSessionWithSets[],
  weeks = 12,
): TrendPoint[] {
  const thisWeek = weekStart(new Date());
  const keys: string[] = [];
  const index = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - i * 7);
    const k = toISODate(d);
    index.set(k, keys.length);
    keys.push(k);
  }
  const vals = new Array(keys.length).fill(0);
  for (const s of sessions) {
    const k = toISODate(weekStart(new Date(`${s.performed_on}T00:00:00`)));
    const i = index.get(k);
    if (i === undefined) continue;
    vals[i] += s.sets.reduce((sum, x) => sum + setVolume(x.reps, x.weight_kg), 0);
  }
  return keys.map((date, i) => ({ date, value: Math.round(vals[i]) }));
}

// ---- Modality-aware overview (hybrid clients train across several streams) ----

/** Distinct modalities this client has actually logged, in registry order. */
export function modalitiesTrained(sessions: WorkoutSessionWithSets[]): Modality[] {
  const seen = new Set<string>();
  for (const s of sessions) seen.add(s.modality);
  return MODALITIES.map((m) => m.key).filter((k) => seen.has(k));
}

/** `weeks` empty weekly buckets (oldest first) + an index from week-start key. */
function weekBuckets(weeks: number): { keys: string[]; index: Map<string, number> } {
  const thisWeek = weekStart(new Date());
  const keys: string[] = [];
  const index = new Map<string, number>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - i * 7);
    const k = toISODate(d);
    index.set(k, keys.length);
    keys.push(k);
  }
  return { keys, index };
}

function weekKeyOf(s: WorkoutSessionWithSets): string {
  return toISODate(weekStart(new Date(`${s.performed_on}T00:00:00`)));
}

/** Sessions logged per week (modality-neutral), trailing `weeks` weeks. */
export function weeklySessions(sessions: WorkoutSessionWithSets[], weeks = 12): TrendPoint[] {
  const { keys, index } = weekBuckets(weeks);
  const vals = new Array(keys.length).fill(0);
  for (const s of sessions) {
    const i = index.get(weekKeyOf(s));
    if (i !== undefined) vals[i] += 1;
  }
  return keys.map((date, i) => ({ date, value: vals[i] }));
}

/** Distance covered per week. Running stores kilometres in distance_m, so the sum
 *  is in km for a running client (the only distance-primary stream today). */
export function weeklyDistance(sessions: WorkoutSessionWithSets[], weeks = 12): TrendPoint[] {
  const { keys, index } = weekBuckets(weeks);
  const vals = new Array(keys.length).fill(0);
  for (const s of sessions) {
    const i = index.get(weekKeyOf(s));
    if (i === undefined) continue;
    for (const set of s.sets) if (set.distance_m != null) vals[i] += Number(set.distance_m);
  }
  return keys.map((date, i) => ({ date, value: Math.round(vals[i] * 10) / 10 }));
}

/** Average pace (min/km) per week for running: total minutes ÷ total km that week.
 *  Running stores minutes in duration_sec and km in distance_m. Weeks with no
 *  distance are dropped so the line only spans weeks actually run. */
export function paceTrend(sessions: WorkoutSessionWithSets[], weeks = 12): TrendPoint[] {
  const { keys, index } = weekBuckets(weeks);
  const min = new Array(keys.length).fill(0);
  const km = new Array(keys.length).fill(0);
  for (const s of sessions) {
    const i = index.get(weekKeyOf(s));
    if (i === undefined) continue;
    for (const set of s.sets) {
      if (set.duration_sec != null) min[i] += Number(set.duration_sec);
      if (set.distance_m != null) km[i] += Number(set.distance_m);
    }
  }
  return keys
    .map((date, i) => ({ date, value: km[i] > 0 ? Math.round((min[i] / km[i]) * 100) / 100 : null }))
    .filter((p): p is TrendPoint => p.value != null);
}

/** Total logged session-minutes over the trailing `days` days (uses session duration). */
export function activeMinutes(sessions: WorkoutSessionWithSets[], days = 30): number {
  const cutoff = Date.now() - days * DAY;
  let sum = 0;
  for (const s of sessions) {
    if (new Date(`${s.performed_on}T00:00:00`).getTime() < cutoff) continue;
    if (s.duration_min != null) sum += s.duration_min;
  }
  return sum;
}

/** Distinct days trained over the trailing `days` days. */
export function activeDays(sessions: WorkoutSessionWithSets[], days = 30): number {
  const cutoff = Date.now() - days * DAY;
  const d = new Set<string>();
  for (const s of sessions) {
    if (new Date(`${s.performed_on}T00:00:00`).getTime() >= cutoff) d.add(s.performed_on);
  }
  return d.size;
}

export interface GroupShare {
  group: string;
  sets: number;
  pct: number;
}

/**
 * Attention per muscle group over the trailing `days` days, measured in working
 * sets (so bodyweight and cardio count, unlike a volume-only split).
 */
export function muscleBalance(
  sessions: WorkoutSessionWithSets[],
  days = 30,
): GroupShare[] {
  const cutoff = Date.now() - days * DAY;
  const counts = new Map<string, number>();
  let total = 0;
  for (const s of sessions) {
    if (new Date(`${s.performed_on}T00:00:00`).getTime() < cutoff) continue;
    for (const set of s.sets) {
      const group = GROUP_BY_EXERCISE[set.exercise_name.toLowerCase()] ?? "Other";
      counts.set(group, (counts.get(group) ?? 0) + 1);
      total++;
    }
  }
  return Array.from(counts.entries())
    .map(([group, sets]) => ({ group, sets, pct: total ? Math.round((sets / total) * 100) : 0 }))
    .sort((a, b) => b.sets - a.sets);
}

export interface ExerciseOption {
  name: string;
  sessions: number;
}

/** Exercises that have at least two weighted sessions, for the strength selector. */
export function exercisesWithHistory(
  sessions: WorkoutSessionWithSets[],
): ExerciseOption[] {
  const dates = new Map<string, Set<string>>();
  const display = new Map<string, string>();
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.weight_kg == null) continue;
      const key = set.exercise_name.toLowerCase();
      if (!dates.has(key)) dates.set(key, new Set());
      dates.get(key)!.add(s.performed_on);
      if (!display.has(key)) display.set(key, set.exercise_name);
    }
  }
  return Array.from(dates.entries())
    .map(([key, set]) => ({ name: display.get(key)!, sessions: set.size }))
    .filter((e) => e.sessions >= 2)
    .sort((a, b) => b.sessions - a.sessions);
}

/** Best estimated 1RM per session date for one exercise (oldest first). */
export function exerciseStrengthTrend(
  sessions: WorkoutSessionWithSets[],
  exercise: string,
): TrendPoint[] {
  const key = exercise.toLowerCase();
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    let best = 0;
    for (const set of s.sets) {
      if (set.exercise_name.toLowerCase() !== key || set.weight_kg == null) continue;
      best = Math.max(best, est1rm(Number(set.weight_kg), set.reps));
    }
    if (best > 0) {
      const cur = byDate.get(s.performed_on) ?? 0;
      byDate.set(s.performed_on, Math.max(cur, best));
    }
  }
  return Array.from(byDate.entries())
    .map(([date, value]) => ({ date, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface Adherence {
  perWeek: number;
  weeks: number;
  planned: number;
  done: number;
  pct: number;
}

/**
 * Plan adherence over the trailing `weeks` weeks: sessions actually logged vs
 * the active plan's weekly training days. Null when there's no active plan with
 * scheduled days (nothing to measure against).
 */
export function adherence(
  sessions: WorkoutSessionWithSets[],
  plans: WorkoutPlan[],
  weeks = 4,
): Adherence | null {
  // Sum across every active plan — a hybrid client may run one plan per modality.
  const actives = plans.filter((p) => p.is_active);
  if (actives.length === 0) return null;
  const perWeek = actives.reduce(
    (n, p) => n + p.days.filter((d) => d.items.length > 0).length,
    0,
  );
  if (perWeek === 0) return null;

  const cutoff = Date.now() - weeks * 7 * DAY;
  const done = sessions.filter(
    (s) => new Date(`${s.performed_on}T00:00:00`).getTime() >= cutoff,
  ).length;
  const planned = perWeek * weeks;
  return { perWeek, weeks, planned, done, pct: Math.round((done / planned) * 100) };
}

// ---- Phase 2: Today hub + day summaries ----

export interface DaySummary {
  focus: string[]; // top muscle groups, most-worked first
  exercises: number;
  minutes: number; // rough estimate from set count
}

/** Muscle focus, exercise count and an estimated duration for one plan day. */
export function daySummary(day: PlanDay): DaySummary {
  const counts = new Map<string, number>();
  let totalSets = 0;
  for (const it of day.items) {
    const group = GROUP_BY_EXERCISE[it.exercise_name.toLowerCase()];
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
    const s = parseInt(it.sets, 10);
    totalSets += Number.isFinite(s) && s > 0 ? s : 3;
  }
  const focus = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);
  // ~3.5 min per working set including rest; rounded to the nearest 5, floored at 10.
  const minutes = day.items.length ? Math.max(10, Math.round((totalSets * 3.5) / 5) * 5) : 0;
  return { focus, exercises: day.items.length, minutes };
}

export interface WeekProgress {
  done: number;
  target: number;
  pct: number;
}

/** Sessions logged in the current week vs the active plan's training days. */
export function weekProgress(
  sessions: WorkoutSessionWithSets[],
  plans: WorkoutPlan[],
): WeekProgress | null {
  const actives = plans.filter((p) => p.is_active);
  if (actives.length === 0) return null;
  const target = actives.reduce(
    (n, p) => n + p.days.filter((d) => d.items.length > 0).length,
    0,
  );
  if (target === 0) return null;
  const start = weekStart(new Date()).getTime();
  const done = sessions.filter(
    (s) => new Date(`${s.performed_on}T00:00:00`).getTime() >= start,
  ).length;
  return { done, target, pct: Math.round((done / target) * 100) };
}

export interface NextDay {
  planId: string;
  dayIndex: number; // real index into plan.days (for the Log prefill URL)
  day: PlanDay;
}

/**
 * The next training day to suggest from the active plan. With no date-tagging on
 * sessions we rotate through the plan's non-rest days by how many sessions have
 * been logged, so the card advances as the client trains.
 */
export function nextScheduledDay(
  plans: WorkoutPlan[],
  sessions: WorkoutSessionWithSets[],
): NextDay | null {
  const active = plans.find((p) => p.is_active);
  if (!active) return null;
  const nonEmpty = active.days
    .map((day, i) => ({ day, i }))
    .filter((x) => x.day.items.length > 0);
  if (nonEmpty.length === 0) return null;
  const pick = nonEmpty[sessions.length % nonEmpty.length];
  return { planId: active.id, dayIndex: pick.i, day: pick.day };
}

/**
 * The training day(s) a client is scheduled for on `dateISO`, one per active plan
 * whose weekday-tagged day lands on that date. This is how two trainings on the
 * same day surface as two blocks — and a single training as one. When nothing is
 * weekday-tagged for the date (e.g. a plan that uses "Day 1" rotation labels), we
 * fall back to a single rotation-based next day so the card is never empty.
 */
export function todaysScheduledDays(
  plans: WorkoutPlan[],
  sessions: WorkoutSessionWithSets[],
  dateISO: string = localDateISO(new Date()),
): NextDay[] {
  const today: NextDay[] = [];
  for (const p of plans) {
    if (!p.is_active) continue;
    const e = expectedDayOn(p, dateISO);
    if (e) today.push({ planId: e.planId, dayIndex: e.dayIndex, day: e.day });
  }
  if (today.length > 0) return today;
  const one = nextScheduledDay(plans, sessions);
  return one ? [one] : [];
}
