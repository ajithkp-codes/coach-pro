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
