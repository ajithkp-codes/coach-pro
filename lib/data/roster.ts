import { authed } from "./session";
import { expectedDayOn, localDateISO, type ExpectedDay } from "@/lib/roster";
import { DEFAULT_MODALITY, type Modality } from "@/lib/catalog/modalities";
import type { WorkoutPlan } from "@/lib/types";

export type RosterStatus = "done" | "missed" | "pending";

/** One client expected to train on a given date, derived from their active plan. */
export interface RosterEntry {
  clientId: string;
  clientName: string;
  planId: string;
  modality: Modality;
  dayIndex: number;
  dayTitle: string;
  dayLabel: string;
  exerciseCount: number;
  /** done = a session was logged that day; missed = marked no_show; else pending. */
  status: RosterStatus;
}

/** A one-off calendar event (consult/call) on a given date. */
export interface RosterEvent {
  id: string;
  clientId: string | null;
  clientName: string | null;
  title: string | null;
  startsAt: string;
  durationMin: number;
  location: string | null;
}

export interface DayRoster {
  dateISO: string;
  sessions: RosterEntry[];
  events: RosterEvent[];
}

type PlanRow = {
  id: string;
  client_id: string;
  name: string;
  notes: string | null;
  is_active: boolean;
  modality: Modality | null;
  days: WorkoutPlan["days"] | null;
};

/** [start,end) ISO window for a local yyyy-mm-dd day. */
function dayWindow(dateISO: string): { start: string; end: string } {
  const start = new Date(`${dateISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * The training roster for a single local day, DERIVED from active workout plans
 * (plan days are weekday-tagged, so "who trains today" needs no re-entry), plus
 * any one-off events on that day. Status is resolved against logged sessions
 * ("showed up") and attendance rows ("marked missed").
 */
export async function getDayRoster(dateISO?: string): Promise<DayRoster> {
  const { supabase } = await authed();
  const date = dateISO ?? localDateISO(new Date());
  const { start, end } = dayWindow(date);

  const [plansRes, clientsRes, sessionsRes, missedRes, eventsRes] = await Promise.all([
    supabase
      .from("workout_plans")
      .select("id, client_id, name, notes, is_active, modality, days")
      .eq("is_active", true),
    supabase.from("clients").select("id, full_name, status"),
    supabase
      .from("workout_sessions")
      .select("client_id, performed_on")
      .eq("performed_on", date),
    supabase
      .from("appointments")
      .select("client_id")
      .eq("kind", "attendance")
      .eq("status", "no_show")
      .gte("starts_at", start)
      .lt("starts_at", end),
    supabase
      .from("appointments")
      .select("id, client_id, title, starts_at, duration_min, location, clients(full_name)")
      .eq("kind", "event")
      .neq("status", "cancelled")
      .gte("starts_at", start)
      .lt("starts_at", end)
      .order("starts_at", { ascending: true }),
  ]);
  if (plansRes.error) throw plansRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (missedRes.error) throw missedRes.error;
  if (eventsRes.error) throw eventsRes.error;

  const plans = (plansRes.data ?? []) as PlanRow[];
  const clients = (clientsRes.data ?? []) as { id: string; full_name: string; status: string }[];
  const activeById = new Map(
    clients.filter((c) => c.status === "active").map((c) => [c.id, c.full_name]),
  );
  const loggedToday = new Set(
    ((sessionsRes.data ?? []) as { client_id: string }[]).map((s) => s.client_id),
  );
  const missedToday = new Set(
    ((missedRes.data ?? []) as { client_id: string | null }[])
      .map((m) => m.client_id)
      .filter((id): id is string => !!id),
  );

  const sessions: RosterEntry[] = [];
  for (const p of plans) {
    const name = activeById.get(p.client_id);
    if (!name) continue; // archived/other-tenant clients excluded
    const expected: ExpectedDay | null = expectedDayOn(
      { ...p, days: p.days ?? [] } as WorkoutPlan,
      date,
    );
    if (!expected) continue;
    const status: RosterStatus = loggedToday.has(p.client_id)
      ? "done"
      : missedToday.has(p.client_id)
        ? "missed"
        : "pending";
    sessions.push({
      clientId: p.client_id,
      clientName: name,
      planId: p.id,
      modality: (p.modality ?? DEFAULT_MODALITY) as Modality,
      dayIndex: expected.dayIndex,
      dayTitle: expected.day.title || expected.day.day,
      dayLabel: expected.day.day,
      exerciseCount: expected.day.items.length,
      status,
    });
  }
  sessions.sort((a, b) => a.clientName.localeCompare(b.clientName));

  type EventRow = {
    id: string;
    client_id: string | null;
    title: string | null;
    starts_at: string;
    duration_min: number;
    location: string | null;
    clients: { full_name: string } | null;
  };
  const events: RosterEvent[] = ((eventsRes.data ?? []) as unknown as EventRow[]).map((e) => ({
    id: e.id,
    clientId: e.client_id,
    clientName: e.clients?.full_name ?? null,
    title: e.title,
    startsAt: e.starts_at,
    durationMin: e.duration_min,
    location: e.location,
  }));

  return { dateISO: date, sessions, events };
}

/** Rosters for a span of local days (inclusive start, `count` days). For the week view. */
export async function getWeekRoster(startISO: string, count = 7): Promise<DayRoster[]> {
  const base = new Date(`${startISO}T00:00:00`);
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(localDateISO(d));
  }
  return Promise.all(dates.map((d) => getDayRoster(d)));
}
