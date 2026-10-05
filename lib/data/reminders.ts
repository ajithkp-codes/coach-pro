import { authed } from "./session";
import { todayISO } from "@/lib/format";
import type { Reminder, ReminderWithClient } from "@/lib/types";
import type { ReminderInput } from "@/lib/validation";

export async function listClientReminders(
  clientId: string,
): Promise<Reminder[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("client_id", clientId)
    .order("done", { ascending: true })
    .order("due_on", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Reminder[];
}

/** Open reminders across all clients, with client name resolved, due first. */
export async function listOpenReminders(
  limit = 50,
): Promise<ReminderWithClient[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, clients(full_name)")
    .eq("done", false)
    .order("due_on", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const { clients, ...rest } = r as Reminder & {
      clients: { full_name: string } | null;
    };
    return { ...rest, client_name: clients?.full_name ?? null };
  });
}

export async function createReminder(input: ReminderInput): Promise<Reminder> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      trainer_id: trainerId,
      client_id: input.client_id,
      title: input.title,
      note: input.note,
      due_on: input.due_on,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reminder;
}

export async function setReminderDone(
  id: string,
  done: boolean,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("reminders")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

/** Counts for the dashboard badge: overdue and due-today. */
export async function reminderCounts() {
  const { supabase } = await authed();
  const today = todayISO();
  const [overdue, dueToday] = await Promise.all([
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("done", false).lt("due_on", today),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("done", false).eq("due_on", today),
  ]);
  return { overdue: overdue.count ?? 0, dueToday: dueToday.count ?? 0 };
}
