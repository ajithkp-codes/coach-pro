import { authed } from "./session";
import type { Goal } from "@/lib/types";
import type { GoalInput } from "@/lib/validation";
import { METRIC_BY_KEY } from "@/lib/catalog/metrics";
import { MARKER_BY_KEY } from "@/lib/catalog/markers";
import { progressPct } from "@/lib/progress";

export async function listGoals(clientId: string): Promise<Goal[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(
  clientId: string,
  input: GoalInput,
): Promise<Goal> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      ...input,
      achieved_at: input.status === "achieved" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(id: string, input: GoalInput): Promise<Goal> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("goals")
    .update({
      ...input,
      achieved_at: input.status === "achieved" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export interface GoalProgress {
  current: number | null;
  measuredOn: string | null;
  /** 0–100, clamped; null when it can't be computed. */
  pct: number | null;
  lowerIsBetter: boolean;
}

/**
 * Compute progress for a metric-linked goal from the latest recorded reading.
 * Works for body-metric fields (weight_kg, waist_cm, …) and health markers.
 * Returns pct = how far from start_value toward target_value the latest value is.
 */
export async function computeGoalProgress(goal: Goal): Promise<GoalProgress> {
  const lowerIsBetter =
    (goal.metric_key && METRIC_BY_KEY[goal.metric_key]?.lowerIsBetter) || false;

  if (!goal.metric_key || goal.target_value === null) {
    return { current: null, measuredOn: null, pct: null, lowerIsBetter };
  }

  const current = await latestValueForMetricKey(goal.client_id, goal.metric_key);
  if (!current) {
    return { current: null, measuredOn: null, pct: null, lowerIsBetter };
  }

  const pct = progressPct(
    goal.start_value,
    goal.target_value,
    current.value,
    lowerIsBetter,
  );

  return {
    current: current.value,
    measuredOn: current.measured_on,
    pct,
    lowerIsBetter,
  };
}

/** Latest value for either a body-metric field or a health marker key. */
async function latestValueForMetricKey(
  clientId: string,
  key: string,
): Promise<{ value: number; measured_on: string } | null> {
  const { supabase } = await authed();

  if (METRIC_BY_KEY[key]) {
    const { data } = await supabase
      .from("body_metrics")
      .select(`measured_on, ${key}`)
      .eq("client_id", clientId)
      .not(key, "is", null)
      .order("measured_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const row = data as unknown as Record<string, unknown>;
    return { value: Number(row[key]), measured_on: String(row.measured_on) };
  }

  if (MARKER_BY_KEY[key]) {
    const { data } = await supabase
      .from("health_markers")
      .select("measured_on, value")
      .eq("client_id", clientId)
      .eq("marker_key", key)
      .order("measured_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      value: Number((data as { value: number }).value),
      measured_on: String((data as { measured_on: string }).measured_on),
    };
  }

  return null;
}
