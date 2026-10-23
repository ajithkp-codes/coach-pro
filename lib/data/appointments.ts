import { authed } from "./session";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWithClient,
} from "@/lib/types";
import type { AppointmentInput } from "@/lib/validation";

/** Parse a datetime-local ("2026-10-22T14:30") or ISO string to a stored ISO. */
function toISO(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}

/** [start, end) ISO window for a yyyy-mm-dd date, in the server's local time. */
function dayWindow(dateISO: string): { start: string; end: string } {
  const start = new Date(`${dateISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Row = Appointment & { clients: { full_name: string } | null };
function resolveName(rows: Row[]): AppointmentWithClient[] {
  return rows.map((r) => {
    const { clients, ...rest } = r;
    return { ...rest, client_name: clients?.full_name ?? null };
  });
}

/**
 * Today's one-off EVENTS (consults, calls — kind='event'), plus any still-scheduled
 * events whose time has already passed (overdue — need a status decision). The
 * plan-derived training roster is computed separately from workout plans
 * (see lib/data/roster.ts); this is only the ad-hoc calendar.
 */
export async function listAgenda(): Promise<{
  overdue: AppointmentWithClient[];
  today: AppointmentWithClient[];
}> {
  const { supabase } = await authed();
  const { start, end } = dayWindow(localTodayISO());

  const [todayRes, overdueRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, clients(full_name)")
      .eq("kind", "event")
      .gte("starts_at", start)
      .lt("starts_at", end)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("*, clients(full_name)")
      .eq("kind", "event")
      .lt("starts_at", start)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(20),
  ]);
  if (todayRes.error) throw todayRes.error;
  if (overdueRes.error) throw overdueRes.error;
  return {
    today: resolveName((todayRes.data ?? []) as Row[]),
    overdue: resolveName((overdueRes.data ?? []) as Row[]),
  };
}

/** Upcoming one-off events within a date range (for the Schedule week view). */
export async function listEventsBetween(
  startISO: string,
  endISO: string,
): Promise<AppointmentWithClient[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(full_name)")
    .eq("kind", "event")
    .gte("starts_at", startISO)
    .lt("starts_at", endISO)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return resolveName((data ?? []) as Row[]);
}

/** Missed plan sessions (kind='attendance', no_show) since a date — per client/day. */
export async function listMissedSince(
  sinceISO: string,
): Promise<{ client_id: string | null; starts_at: string }[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("appointments")
    .select("client_id, starts_at")
    .eq("kind", "attendance")
    .eq("status", "no_show")
    .gte("starts_at", sinceISO);
  if (error) throw error;
  return (data ?? []) as { client_id: string | null; starts_at: string }[];
}

export async function listClientAppointments(
  clientId: string,
): Promise<Appointment[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

/** Record a plan session as missed for a client on a local day (an attendance row). */
export async function markMissed(
  clientId: string,
  dateISO: string,
  title: string | null,
): Promise<void> {
  const { supabase, trainerId } = await authed();
  const { start, end } = dayWindow(dateISO);
  // Replace any prior attendance mark for this client/day (events are untouched).
  await supabase
    .from("appointments")
    .delete()
    .eq("client_id", clientId)
    .eq("kind", "attendance")
    .gte("starts_at", start)
    .lt("starts_at", end);
  const { error } = await supabase.from("appointments").insert({
    trainer_id: trainerId,
    client_id: clientId,
    kind: "attendance",
    starts_at: new Date(`${dateISO}T12:00:00`).toISOString(),
    title: title ?? "Missed session",
    status: "no_show",
  });
  if (error) throw error;
}

/** Undo a missed mark for a client on a local day. */
export async function clearMissed(clientId: string, dateISO: string): Promise<void> {
  const { supabase } = await authed();
  const { start, end } = dayWindow(dateISO);
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("client_id", clientId)
    .eq("kind", "attendance")
    .gte("starts_at", start)
    .lt("starts_at", end);
  if (error) throw error;
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      trainer_id: trainerId,
      client_id: input.client_id,
      kind: "event",
      starts_at: toISO(input.starts_at),
      duration_min: input.duration_min,
      title: input.title,
      location: input.location,
      notes: input.notes,
      status: input.status,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("appointments")
    .update({
      client_id: input.client_id,
      starts_at: toISO(input.starts_at),
      duration_min: input.duration_min,
      title: input.title,
      location: input.location,
      notes: input.notes,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}
