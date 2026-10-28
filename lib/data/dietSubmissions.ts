import { authed } from "./session";
import type { DietSubmission } from "@/lib/types";

/** Pending client submissions for a client (newest day first). */
export async function listDietSubmissions(clientId: string): Promise<DietSubmission[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("diet_log_submissions")
    .select("*")
    .eq("client_id", clientId)
    .order("logged_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DietSubmission[];
}

export async function getDietSubmission(id: string): Promise<DietSubmission | null> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("diet_log_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as DietSubmission) ?? null;
}

/** How many days are waiting for review (for a tab badge). */
export async function countDietSubmissions(clientId: string): Promise<number> {
  const { supabase } = await authed();
  const { count } = await supabase
    .from("diet_log_submissions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  return count ?? 0;
}

/**
 * Accept a submission into the real food log (source='client') and remove it
 * from the queue. RLS confirms the row belongs to this trainer before we read it.
 */
export async function acceptDietSubmission(id: string): Promise<void> {
  const { supabase, trainerId } = await authed();

  const { data: sub, error: readErr } = await supabase
    .from("diet_log_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!sub) throw new Error("Submission not found");
  const submission = sub as DietSubmission;

  const { data: log, error: logErr } = await supabase
    .from("diet_logs")
    .insert({
      trainer_id: trainerId,
      client_id: submission.client_id,
      logged_on: submission.logged_on,
      water_ml: submission.water_ml,
      notes: submission.notes,
      source: "client",
    })
    .select("id")
    .single();
  if (logErr) throw logErr;

  const entries = submission.entries ?? [];
  if (entries.length) {
    const rows = entries.map((e, i) => ({
      trainer_id: trainerId,
      client_id: submission.client_id,
      log_id: log.id,
      position: i,
      meal: e.meal,
      eaten_at: e.eaten_at,
      food: e.food,
      quantity: e.quantity,
      calories: e.calories,
      protein_g: e.protein_g,
      notes: e.notes,
    }));
    const { error: entErr } = await supabase.from("diet_log_entries").insert(rows);
    if (entErr) throw entErr;
  }

  const { error: delErr } = await supabase.from("diet_log_submissions").delete().eq("id", id);
  if (delErr) throw delErr;
}

/** Discard a submission without logging it. */
export async function deleteDietSubmission(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("diet_log_submissions").delete().eq("id", id);
  if (error) throw error;
}
