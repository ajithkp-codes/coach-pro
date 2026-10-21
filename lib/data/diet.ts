import { authed } from "./session";
import type { DietLog, DietLogWithEntries } from "@/lib/types";
import type { DietLogInput } from "@/lib/validation";

/** List a client's daily diet logs (newest first) with their entries attached. */
export async function listDietLogs(clientId: string): Promise<DietLogWithEntries[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("diet_logs")
    .select("*, entries:diet_log_entries(*)")
    .eq("client_id", clientId)
    .order("logged_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "diet_log_entries", ascending: true });
  if (error) throw error;
  return (data ?? []) as DietLogWithEntries[];
}

export async function getDietLog(logId: string): Promise<DietLogWithEntries | null> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("diet_logs")
    .select("*, entries:diet_log_entries(*)")
    .eq("id", logId)
    .order("position", { referencedTable: "diet_log_entries", ascending: true })
    .maybeSingle();
  return (data as DietLogWithEntries) ?? null;
}

async function insertEntries(
  supabase: Awaited<ReturnType<typeof authed>>["supabase"],
  trainerId: string,
  clientId: string,
  logId: string,
  entries: DietLogInput["entries"],
) {
  if (!entries.length) return;
  const rows = entries.map((e, i) => ({
    trainer_id: trainerId,
    client_id: clientId,
    log_id: logId,
    position: i,
    meal: e.meal,
    eaten_at: e.eaten_at,
    food: e.food,
    quantity: e.quantity,
    calories: e.calories,
    protein_g: e.protein_g,
    notes: e.notes,
  }));
  const { error } = await supabase.from("diet_log_entries").insert(rows);
  if (error) throw error;
}

export async function createDietLog(
  clientId: string,
  input: DietLogInput,
): Promise<DietLog> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("diet_logs")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      logged_on: input.logged_on,
      water_ml: input.water_ml,
      notes: input.notes,
    })
    .select("*")
    .single();
  if (error) throw error;
  await insertEntries(supabase, trainerId, clientId, data.id, input.entries);
  return data as DietLog;
}

export async function updateDietLog(
  logId: string,
  clientId: string,
  input: DietLogInput,
): Promise<DietLog> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("diet_logs")
    .update({
      logged_on: input.logged_on,
      water_ml: input.water_ml,
      notes: input.notes,
    })
    .eq("id", logId)
    .select("*")
    .single();
  if (error) throw error;

  // Replace the entry list wholesale (a day has few entries).
  const del = await supabase.from("diet_log_entries").delete().eq("log_id", logId);
  if (del.error) throw del.error;
  await insertEntries(supabase, trainerId, clientId, logId, input.entries);

  return data as DietLog;
}

export async function deleteDietLog(logId: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("diet_logs").delete().eq("id", logId);
  if (error) throw error;
}
