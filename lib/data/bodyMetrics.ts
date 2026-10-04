import { authed } from "./session";
import type { BodyMetric } from "@/lib/types";
import type { BodyMetricInput } from "@/lib/validation";

export async function listBodyMetrics(
  clientId: string,
): Promise<BodyMetric[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("client_id", clientId)
    .order("measured_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BodyMetric[];
}

export async function createBodyMetric(
  clientId: string,
  input: BodyMetricInput,
): Promise<BodyMetric> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("body_metrics")
    .insert({ trainer_id: trainerId, client_id: clientId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as BodyMetric;
}

export async function updateBodyMetric(
  id: string,
  input: BodyMetricInput,
): Promise<BodyMetric> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("body_metrics")
    .update({ ...input })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BodyMetric;
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("body_metrics").delete().eq("id", id);
  if (error) throw error;
}

/** Latest non-null value for a given body-metric field (for goal progress / overview). */
export async function latestMetricValue(
  clientId: string,
  field: string,
): Promise<{ value: number; measured_on: string } | null> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("body_metrics")
    .select(`measured_on, ${field}`)
    .eq("client_id", clientId)
    .not(field, "is", null)
    .order("measured_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Record<string, unknown>;
  return {
    value: Number(row[field]),
    measured_on: String(row.measured_on),
  };
}
