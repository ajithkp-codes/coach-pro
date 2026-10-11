import { authed } from "./session";
import type { HealthMarker } from "@/lib/types";
import type { HealthMarkerInput } from "@/lib/validation";
import { MARKER_BY_KEY } from "@/lib/catalog/markers";

export async function listHealthMarkers(
  clientId: string,
  markerKey?: string,
): Promise<HealthMarker[]> {
  const { supabase } = await authed();
  let query = supabase
    .from("health_markers")
    .select("*")
    .eq("client_id", clientId)
    .order("measured_on", { ascending: false });
  if (markerKey) query = query.eq("marker_key", markerKey);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as HealthMarker[];
}

export async function createHealthMarker(
  clientId: string,
  input: HealthMarkerInput,
): Promise<HealthMarker> {
  const { supabase, trainerId } = await authed();
  // Default the unit from the catalog if the trainer left it blank.
  const unit = input.unit ?? MARKER_BY_KEY[input.marker_key]?.unit ?? null;
  const { data, error } = await supabase
    .from("health_markers")
    .insert({ trainer_id: trainerId, client_id: clientId, ...input, unit })
    .select("*")
    .single();
  if (error) throw error;
  return data as HealthMarker;
}

export async function updateHealthMarker(
  id: string,
  input: HealthMarkerInput,
): Promise<HealthMarker> {
  const { supabase } = await authed();
  const unit = input.unit ?? MARKER_BY_KEY[input.marker_key]?.unit ?? null;
  const { data, error } = await supabase
    .from("health_markers")
    .update({ ...input, unit })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as HealthMarker;
}

export async function deleteHealthMarker(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("health_markers").delete().eq("id", id);
  if (error) throw error;
}

/** Distinct marker keys recorded for a client (to populate the chart picker). */
export async function recordedMarkerKeys(clientId: string): Promise<string[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("health_markers")
    .select("marker_key")
    .eq("client_id", clientId);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.marker_key as string)));
}
