import { authed } from "./session";
import type { WorkoutSession, WorkoutSessionWithSets } from "@/lib/types";
import type { WorkoutSessionInput } from "@/lib/validation";

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
      notes: input.notes,
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
      notes: input.notes,
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

export interface LastExercise {
  date: string;
  sets: { reps: number | null; weight_kg: number | null }[];
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
        out[key].sets.push({ reps: set.reps, weight_kg: set.weight_kg });
      }
    }
  }
  return out;
}

export interface ExerciseBest {
  weight: number;
  e1rm: number;
}

/** Per-exercise best weight and estimated 1RM across all history. */
export async function getExerciseBests(
  clientId: string,
  excludeSessionId?: string,
): Promise<Record<string, ExerciseBest>> {
  const sessions = await listSessions(clientId);
  const bests: Record<string, ExerciseBest> = {};
  for (const s of sessions) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    for (const set of s.sets) {
      if (set.weight_kg == null) continue;
      const key = set.exercise_name.toLowerCase();
      const w = Number(set.weight_kg);
      const e = est1rm(w, set.reps);
      const cur = bests[key] ?? { weight: 0, e1rm: 0 };
      bests[key] = { weight: Math.max(cur.weight, w), e1rm: Math.max(cur.e1rm, e) };
    }
  }
  return bests;
}

export interface PR {
  exercise_name: string;
  weight: number;
  reps: number | null;
  kind: "weight" | "e1rm";
}

/** Detect which of `sets` beat the historical bests (one PR per exercise). */
export function detectPRs(
  sets: { exercise_name: string; reps: number | null; weight_kg: number | null }[],
  bests: Record<string, ExerciseBest>,
): PR[] {
  const prByExercise = new Map<string, PR>();
  for (const s of sets) {
    if (s.weight_kg == null) continue;
    const key = s.exercise_name.toLowerCase();
    const w = Number(s.weight_kg);
    const e = est1rm(w, s.reps);
    const best = bests[key] ?? { weight: 0, e1rm: 0 };
    const beatsWeight = w > best.weight + 0.01;
    const beatsE1rm = e > best.e1rm + 0.01;
    if (!beatsWeight && !beatsE1rm) continue;
    const pr: PR = {
      exercise_name: s.exercise_name,
      weight: w,
      reps: s.reps,
      kind: beatsWeight ? "weight" : "e1rm",
    };
    const existing = prByExercise.get(key);
    if (!existing || w > existing.weight) prByExercise.set(key, pr);
  }
  return Array.from(prByExercise.values());
}
