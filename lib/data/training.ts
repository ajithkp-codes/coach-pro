import { authed } from "./session";
import type { WorkoutSession, WorkoutSessionWithSets } from "@/lib/types";
import type { WorkoutSessionInput } from "@/lib/validation";
import type { PrimaryMetric } from "@/lib/catalog/modalities";

/** List a client's workout sessions (newest first) with their sets attached. */
export async function listSessions(
  clientId: string,
): Promise<WorkoutSessionWithSets[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*, sets:workout_sets(*)")
    .eq("client_id", clientId)
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "workout_sets", ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutSessionWithSets[];
}

async function insertSets(
  supabase: Awaited<ReturnType<typeof authed>>["supabase"],
  trainerId: string,
  clientId: string,
  sessionId: string,
  sets: WorkoutSessionInput["sets"],
) {
  if (!sets.length) return;
  const rows = sets.map((s, i) => ({
    trainer_id: trainerId,
    client_id: clientId,
    session_id: sessionId,
    position: i,
    exercise_name: s.exercise_name,
    reps: s.reps,
    weight_kg: s.weight_kg,
    rpe: s.rpe,
    duration_sec: s.duration_sec,
    distance_m: s.distance_m,
    metrics: s.metrics,
    notes: s.notes,
  }));
  const { error } = await supabase.from("workout_sets").insert(rows);
  if (error) throw error;
}

export async function createSession(
  clientId: string,
  input: WorkoutSessionInput,
): Promise<WorkoutSession> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      performed_on: input.performed_on,
      title: input.title,
      duration_min: input.duration_min,
      modality: input.modality,
      notes: input.notes,
      plan_id: input.plan_id,
      plan_day: input.plan_day,
      week_number: input.week_number,
    })
    .select("*")
    .single();
  if (error) throw error;
  await insertSets(supabase, trainerId, clientId, data.id, input.sets);
  return data as WorkoutSession;
}

export async function updateSession(
  sessionId: string,
  clientId: string,
  input: WorkoutSessionInput,
): Promise<WorkoutSession> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      performed_on: input.performed_on,
      title: input.title,
      duration_min: input.duration_min,
      modality: input.modality,
      notes: input.notes,
      plan_id: input.plan_id,
      plan_day: input.plan_day,
      week_number: input.week_number,
    })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error) throw error;

  // Replace the set list wholesale (sets are few per session).
  const del = await supabase.from("workout_sets").delete().eq("session_id", sessionId);
  if (del.error) throw del.error;
  await insertSets(supabase, trainerId, clientId, sessionId, input.sets);

  return data as WorkoutSession;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}

/** Total training volume (Σ reps × weight) for a session. */
export function sessionVolume(session: WorkoutSessionWithSets): number {
  return session.sets.reduce((sum, s) => {
    if (s.reps != null && s.weight_kg != null) {
      return sum + Number(s.reps) * Number(s.weight_kg);
    }
    return sum;
  }, 0);
}

/** Estimated 1-rep max (Epley). Falls back to the weight when reps are missing. */
export function est1rm(weight: number, reps: number | null): number {
  const r = reps && reps > 0 ? reps : 1;
  return weight * (1 + r / 30);
}

/** One logged set reduced to the numbers progress/PR tracking cares about. */
export interface LastSet {
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  distance_m: number | null;
}

export interface LastExercise {
  date: string;
  sets: LastSet[];
}

/** For each exercise the client has done, the sets from its most recent session. */
export async function getLastSetsByExercise(
  clientId: string,
  prefetched?: WorkoutSessionWithSets[],
): Promise<Record<string, LastExercise>> {
  const sessions = prefetched ?? await listSessions(clientId); // newest first
  const out: Record<string, LastExercise> = {};
  for (const s of sessions) {
    for (const set of s.sets) {
      const key = set.exercise_name.toLowerCase();
      if (!out[key]) out[key] = { date: s.performed_on, sets: [] };
      // only collect from the first (most recent) session for this exercise
      if (out[key].date === s.performed_on) {
        out[key].sets.push({
          reps: set.reps,
          weight_kg: set.weight_kg,
          duration_sec: set.duration_sec,
          distance_m: set.distance_m,
        });
      }
    }
  }
  return out;
}

/** Per-exercise bests across all history, by metric — so a reps/hold/distance
 * modality can celebrate its own kind of PR, not just load. */
export interface ExerciseBest {
  weight: number;
  e1rm: number;
  reps: number;
  duration: number;
  distance: number;
}

const emptyBest = (): ExerciseBest => ({ weight: 0, e1rm: 0, reps: 0, duration: 0, distance: 0 });

/** Per-exercise best weight, estimated 1RM, reps, hold and distance across history. */
export async function getExerciseBests(
  clientId: string,
  excludeSessionId?: string,
): Promise<Record<string, ExerciseBest>> {
  const sessions = await listSessions(clientId);
  const bests: Record<string, ExerciseBest> = {};
  for (const s of sessions) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    for (const set of s.sets) {
      const key = set.exercise_name.toLowerCase();
      const cur = bests[key] ?? emptyBest();
      if (set.weight_kg != null) {
        const w = Number(set.weight_kg);
        cur.weight = Math.max(cur.weight, w);
        cur.e1rm = Math.max(cur.e1rm, est1rm(w, set.reps));
      }
      if (set.reps != null) cur.reps = Math.max(cur.reps, Number(set.reps));
      if (set.duration_sec != null) cur.duration = Math.max(cur.duration, Number(set.duration_sec));
      if (set.distance_m != null) cur.distance = Math.max(cur.distance, Number(set.distance_m));
      bests[key] = cur;
    }
  }
  return bests;
}

export type PRKind = "weight" | "e1rm" | "reps" | "duration" | "distance";

export interface PR {
  exercise_name: string;
  kind: PRKind;
  /** Pre-formatted achievement, e.g. "62.5kg × 8", "15 reps", "0:45 hold". */
  label: string;
}

export interface PRSetInput {
  exercise_name: string;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  distance_m: number | null;
}

const num = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const clock = (sec: number): string =>
  sec >= 60 ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}` : `${num(sec)}s`;

/**
 * Detect which of `sets` beat the historical bests for this session's modality
 * (one PR per exercise). Strength keys on load / estimated 1RM; a reps-, hold- or
 * distance-first modality keys on that metric instead.
 */
export function detectPRs(
  sets: PRSetInput[],
  bests: Record<string, ExerciseBest>,
  primaryMetric: PrimaryMetric = "weight",
): PR[] {
  const prByExercise = new Map<string, { pr: PR; rank: number }>();
  for (const s of sets) {
    const key = s.exercise_name.toLowerCase();
    const best = bests[key] ?? emptyBest();
    let pr: PR | null = null;
    let rank = 0;

    if (primaryMetric === "weight") {
      if (s.weight_kg == null) continue;
      const w = Number(s.weight_kg);
      const e = est1rm(w, s.reps);
      const beatsWeight = w > best.weight + 0.01;
      const beatsE1rm = e > best.e1rm + 0.01;
      if (!beatsWeight && !beatsE1rm) continue;
      rank = w;
      pr = {
        exercise_name: s.exercise_name,
        kind: beatsWeight ? "weight" : "e1rm",
        label: `${num(w)}kg${s.reps != null ? ` × ${num(Number(s.reps))}` : ""}`,
      };
    } else if (primaryMetric === "reps") {
      if (s.reps == null) continue;
      const r = Number(s.reps);
      if (r <= best.reps + 0.01) continue;
      rank = r;
      pr = { exercise_name: s.exercise_name, kind: "reps", label: `${num(r)} reps` };
    } else if (primaryMetric === "duration") {
      if (s.duration_sec == null) continue;
      const d = Number(s.duration_sec);
      if (d <= best.duration + 0.01) continue;
      rank = d;
      pr = { exercise_name: s.exercise_name, kind: "duration", label: `${clock(d)} hold` };
    } else if (primaryMetric === "distance") {
      if (s.distance_m == null) continue;
      const d = Number(s.distance_m);
      if (d <= best.distance + 0.01) continue;
      rank = d;
      pr = { exercise_name: s.exercise_name, kind: "distance", label: `${num(d)}m` };
    }

    if (!pr) continue;
    const existing = prByExercise.get(key);
    if (!existing || rank > existing.rank) prByExercise.set(key, { pr, rank });
  }
  return Array.from(prByExercise.values()).map((v) => v.pr);
}
