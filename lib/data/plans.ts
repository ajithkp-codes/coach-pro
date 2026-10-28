import { authed } from "./session";
import type { WorkoutPlan } from "@/lib/types";
import type { Modality } from "@/lib/catalog/modalities";
import type { WorkoutPlanInput } from "@/lib/validation";

export async function listPlans(clientId: string): Promise<WorkoutPlan[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("client_id", clientId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WorkoutPlan[];
}

export async function getActivePlan(clientId: string): Promise<WorkoutPlan | null> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as WorkoutPlan) ?? null;
}

/** Deactivate the client's other active plan OF THE SAME MODALITY, so a client can
 *  run one active plan per modality at once (e.g. a running plan AND a strength
 *  plan) — two trainings can then fall on the same day. Activating a plan only
 *  displaces another of its own kind, never a different discipline. */
async function clearActive(clientId: string, modality: Modality, exceptId?: string) {
  const { supabase } = await authed();
  let q = supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("client_id", clientId)
    .eq("modality", modality)
    .eq("is_active", true);
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

export async function createPlan(
  clientId: string,
  input: WorkoutPlanInput,
): Promise<WorkoutPlan> {
  const { supabase, trainerId } = await authed();
  if (input.is_active) await clearActive(clientId, input.modality);
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      name: input.name,
      notes: input.notes,
      is_active: input.is_active,
      modality: input.modality,
      days: input.days,
      cadence: input.cadence,
      duration_weeks: input.duration_weeks,
      starts_on: input.starts_on,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkoutPlan;
}

export async function updatePlan(
  id: string,
  clientId: string,
  input: WorkoutPlanInput,
): Promise<WorkoutPlan> {
  const { supabase } = await authed();
  if (input.is_active) await clearActive(clientId, input.modality, id);
  const { data, error } = await supabase
    .from("workout_plans")
    .update({
      name: input.name,
      notes: input.notes,
      is_active: input.is_active,
      modality: input.modality,
      days: input.days,
      cadence: input.cadence,
      duration_weeks: input.duration_weeks,
      starts_on: input.starts_on,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkoutPlan;
}

export async function setPlanActive(id: string, clientId: string): Promise<void> {
  const { supabase } = await authed();
  // Only displace another active plan of the same modality.
  const { data: row } = await supabase
    .from("workout_plans")
    .select("modality")
    .eq("id", id)
    .single();
  if (row?.modality) await clearActive(clientId, row.modality as Modality, id);
  const { error } = await supabase
    .from("workout_plans")
    .update({ is_active: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePlan(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("workout_plans").delete().eq("id", id);
  if (error) throw error;
}
