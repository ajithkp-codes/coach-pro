import { authed } from "./session";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import {
  computeCompliance,
  computeRisk,
  type ClientCompliance,
  type RiskResult,
} from "./compliance";
import type { ClientStatus } from "@/lib/types";

export interface ClientCardData {
  id: string;
  full_name: string;
  sex: string;
  date_of_birth: string | null;
  status: ClientStatus;
  phone: string | null;
  email: string | null;
  consent_given: boolean;
  latestWeight: number | null;
  weightDelta: number | null;
  weightSpark: number[];
  lastActivity: string | null;
  lastSessionDate: string | null;
  activeGoals: number;
}

/** A client as shown on the health board — card data + coaching signals. */
export interface ClientBoardItem extends ClientCardData {
  /** Latest diet log / accepted submission date. */
  lastCheckIn: string | null;
  compliance: ClientCompliance;
  risk: RiskResult;
  /** Latest reading of any marker is outside its reference range. */
  markerOutOfRange: boolean;
  /** Has an active goal whose target date has passed. */
  goalOverdue: boolean;
  /** No active workout plan AND no active diet plan — can't be coached yet. */
  noActivePlan: boolean;
  /** Next active goal whose target date falls within the next 14 days. */
  goalDueSoon: { title: string; date: string } | null;
}

export interface ActivityItem {
  clientId: string;
  clientName: string;
  icon: "scale" | "pulse" | "dumbbell" | "camera" | "target";
  label: string;
  at: string;
}

/** A client with diet check-ins waiting in the review queue. */
export interface ReviewItem {
  clientId: string;
  clientName: string;
  days: number;
  latest: string;
}

export interface DashboardData {
  stats: {
    activeClients: number;
    archived: number;
    sessionsThisWeek: number;
    goalsAchieved: number;
    /** Diet check-in days waiting to be reviewed, across all clients. */
    pendingReviews: number;
  };
  /** The active roster, sorted at-risk first (the coaching priority order). */
  board: ClientBoardItem[];
  reviews: ReviewItem[];
  activity: ActivityItem[];
}

const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFromNowISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const maxDate = (...ds: (string | null | undefined)[]) =>
  ds.filter(Boolean).sort().at(-1) ?? null;

const RISK_RANK: Record<string, number> = { at_risk: 0, watch: 1, on_track: 2 };

type ClientRow = {
  id: string;
  full_name: string;
  sex: string;
  date_of_birth: string | null;
  status: string;
  phone: string | null;
  email: string | null;
  consent_given: boolean;
  created_at: string;
};

/**
 * Everything needed to compute a client board, fetched once and held in memory.
 * Both the dashboard and the Clients roster build their boards from this context,
 * so the heavy aggregation lives in exactly one place.
 */
interface BoardContext {
  allClients: ClientRow[];
  nameById: Map<string, string>;
  weekCutoff: string;
  today: string;
  weightsByClient: Map<string, number[]>;
  lastMetricDate: Map<string, string>;
  lastMarkerDate: Map<string, string>;
  lastSessionDate: Map<string, string>;
  lastCheckIn: Map<string, string>;
  missedThisWeek: Map<string, Set<string>>;
  plannedDays: Map<string, number>;
  hasDietPlan: Set<string>;
  activeGoalsByClient: Map<string, number>;
  markerOutByClient: Set<string>;
  goalOverdueByClient: Set<string>;
  goalDueSoonByClient: Map<string, { title: string; date: string }>;
  weekTrainDays: Map<string, Set<string>>;
  weekDietDays: Map<string, Set<string>>;
  weekActivity: Map<string, Set<string>>;
  baselineActivity: Map<string, Set<string>>;
  // Raw rows kept for the dashboard's reviews / activity / stats.
  metrics: { client_id: string; measured_on: string; weight_kg: number | null }[];
  markers: { client_id: string; marker_key: string; custom_name: string | null; value: number; measured_on: string; created_at: string }[];
  goals: { client_id: string; title: string; status: string; target_date: string | null }[];
  sessions: { client_id: string; performed_on: string; title: string | null; created_at: string }[];
  photos: { client_id: string; taken_on: string; created_at: string }[];
  submissions: { client_id: string; logged_on: string }[];
}

/** Fetch every signal and pre-aggregate the per-client maps (one DB round-trip). */
async function loadBoardContext(): Promise<BoardContext> {
  const { supabase } = await authed();

  const recentCutoff = daysAgoISO(90);
  const weekCutoff = daysAgoISO(7);
  const baselineCutoff = daysAgoISO(28);
  const today = daysAgoISO(0);
  const soonCutoff = daysFromNowISO(14);

  const [
    clientsRes,
    metricsRes,
    markersRes,
    goalsRes,
    sessionsRes,
    photosRes,
    submissionsRes,
    dietLogsRes,
    workoutPlansRes,
    dietPlansRes,
    missedApptsRes,
  ] = await Promise.all([
    supabase.from("clients").select("id, full_name, sex, date_of_birth, status, phone, email, consent_given, created_at"),
    supabase.from("body_metrics").select("client_id, measured_on, weight_kg").gte("measured_on", recentCutoff).order("measured_on", { ascending: true }),
    supabase.from("health_markers").select("client_id, marker_key, custom_name, value, measured_on, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("goals").select("client_id, title, status, target_date"),
    supabase.from("workout_sessions").select("client_id, performed_on, title, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("client_photos").select("client_id, taken_on, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("diet_log_submissions").select("client_id, logged_on").order("created_at", { ascending: false }).limit(200),
    supabase.from("diet_logs").select("client_id, logged_on").gte("logged_on", baselineCutoff).limit(500),
    supabase.from("workout_plans").select("client_id, days").eq("is_active", true),
    supabase.from("diet_plans").select("client_id").eq("is_active", true),
    supabase.from("appointments").select("client_id, starts_at").eq("kind", "attendance").eq("status", "no_show").gte("starts_at", `${baselineCutoff}T00:00:00`),
  ]);

  const allClients = (clientsRes.data ?? []) as ClientRow[];
  const nameById = new Map(allClients.map((c) => [c.id, c.full_name]));

  const metrics = (metricsRes.data ?? []) as BoardContext["metrics"];
  const markers = (markersRes.data ?? []) as BoardContext["markers"];
  const goals = (goalsRes.data ?? []) as BoardContext["goals"];
  const sessions = (sessionsRes.data ?? []) as BoardContext["sessions"];
  const photos = (photosRes.data ?? []) as BoardContext["photos"];
  const submissions = (submissionsRes.data ?? []) as BoardContext["submissions"];
  const dietLogs = (dietLogsRes.data ?? []) as { client_id: string; logged_on: string }[];
  const workoutPlans = (workoutPlansRes.data ?? []) as { client_id: string; days: { day: string; items: unknown[] }[] | null }[];
  const dietPlans = (dietPlansRes.data ?? []) as { client_id: string }[];
  const missedAppts = (missedApptsRes.data ?? []) as { client_id: string | null; starts_at: string }[];

  // Per-client weight series (ascending) + last-seen dates per source.
  const weightsByClient = new Map<string, number[]>();
  const lastMetricDate = new Map<string, string>();
  for (const m of metrics) {
    if (m.weight_kg != null) {
      const arr = weightsByClient.get(m.client_id) ?? [];
      arr.push(Number(m.weight_kg));
      weightsByClient.set(m.client_id, arr);
    }
    lastMetricDate.set(m.client_id, maxDate(lastMetricDate.get(m.client_id), m.measured_on)!);
  }
  const lastMarkerDate = new Map<string, string>();
  for (const m of markers) {
    lastMarkerDate.set(m.client_id, maxDate(lastMarkerDate.get(m.client_id), m.measured_on)!);
  }
  const lastSessionDate = new Map<string, string>();
  for (const s of sessions) {
    lastSessionDate.set(s.client_id, maxDate(lastSessionDate.get(s.client_id), s.performed_on)!);
  }

  // Check-ins = diet logs + accepted/trainer logs + pending submissions.
  const lastCheckIn = new Map<string, string>();
  for (const d of dietLogs) lastCheckIn.set(d.client_id, maxDate(lastCheckIn.get(d.client_id), d.logged_on)!);
  for (const s of submissions) lastCheckIn.set(s.client_id, maxDate(lastCheckIn.get(s.client_id), s.logged_on)!);

  // Missed plan sessions (no_show) this week, per client.
  const missedThisWeek = new Map<string, Set<string>>();
  for (const a of missedAppts) {
    if (!a.client_id) continue;
    const date = a.starts_at.slice(0, 10);
    if (date < weekCutoff) continue;
    const s = missedThisWeek.get(a.client_id) ?? new Set<string>();
    s.add(date);
    missedThisWeek.set(a.client_id, s);
  }

  // Planned training days/week = non-empty days on the active workout plan.
  const plannedDays = new Map<string, number>();
  for (const p of workoutPlans) {
    const count = Array.isArray(p.days)
      ? p.days.filter((d) => Array.isArray(d.items) && d.items.length > 0).length
      : 0;
    plannedDays.set(p.client_id, count);
  }
  const hasDietPlan = new Set(dietPlans.map((p) => p.client_id));

  const activeGoalsByClient = new Map<string, number>();
  for (const g of goals) {
    if (g.status === "active") {
      activeGoalsByClient.set(g.client_id, (activeGoalsByClient.get(g.client_id) ?? 0) + 1);
    }
  }
  // Latest-per-key marker out of range, per client.
  const markerOutByClient = new Set<string>();
  const seenMarker = new Set<string>();
  for (const m of markers) {
    const key = `${m.client_id}:${m.marker_key}:${m.custom_name ?? ""}`;
    if (seenMarker.has(key)) continue; // sorted desc → first is latest
    seenMarker.add(key);
    const def = MARKER_BY_KEY[m.marker_key];
    if (!def) continue;
    const out =
      (def.refLow !== undefined && Number(m.value) < def.refLow) ||
      (def.refHigh !== undefined && Number(m.value) > def.refHigh);
    if (out) markerOutByClient.add(m.client_id);
  }
  // Overdue active goals, and the next active goal due within 14 days, per client.
  const goalOverdueByClient = new Set<string>();
  const goalDueSoonByClient = new Map<string, { title: string; date: string }>();
  for (const g of goals) {
    if (g.status !== "active" || !g.target_date) continue;
    if (g.target_date < today) {
      goalOverdueByClient.add(g.client_id);
    } else if (g.target_date <= soonCutoff) {
      const existing = goalDueSoonByClient.get(g.client_id);
      if (!existing || g.target_date < existing.date) {
        goalDueSoonByClient.set(g.client_id, { title: g.title, date: g.target_date });
      }
    }
  }

  // Per-client distinct days this week, by signal, plus an engagement baseline.
  const weekTrainDays = new Map<string, Set<string>>();
  const weekDietDays = new Map<string, Set<string>>();
  const weekActivity = new Map<string, Set<string>>();
  const baselineActivity = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, id: string, date: string) => {
    const s = map.get(id) ?? new Set<string>();
    s.add(date);
    map.set(id, s);
  };
  for (const s of sessions) {
    if (s.performed_on >= weekCutoff) {
      add(weekTrainDays, s.client_id, s.performed_on);
      add(weekActivity, s.client_id, `w:${s.performed_on}`);
    } else if (s.performed_on >= baselineCutoff) {
      add(baselineActivity, s.client_id, `w:${s.performed_on}`);
    }
  }
  for (const d of dietLogs) {
    if (d.logged_on >= weekCutoff) {
      add(weekDietDays, d.client_id, d.logged_on);
      add(weekActivity, d.client_id, `d:${d.logged_on}`);
    } else if (d.logged_on >= baselineCutoff) {
      add(baselineActivity, d.client_id, `d:${d.logged_on}`);
    }
  }

  return {
    allClients, nameById, weekCutoff, today,
    weightsByClient, lastMetricDate, lastMarkerDate, lastSessionDate, lastCheckIn,
    missedThisWeek, plannedDays, hasDietPlan, activeGoalsByClient,
    markerOutByClient, goalOverdueByClient, goalDueSoonByClient,
    weekTrainDays, weekDietDays, weekActivity, baselineActivity,
    metrics, markers, goals, sessions, photos, submissions,
  };
}

/** Build one board item for a client from the pre-aggregated context. */
function buildBoardItem(c: ClientRow, ctx: BoardContext): ClientBoardItem {
  const w = ctx.weightsByClient.get(c.id) ?? [];
  const latestWeight = w.length ? w[w.length - 1] : null;
  const weightDelta = w.length >= 2 ? +(w[w.length - 1] - w[w.length - 2]).toFixed(1) : null;
  const lastSession = ctx.lastSessionDate.get(c.id) ?? null;
  const check = ctx.lastCheckIn.get(c.id) ?? null;
  const lastActivity = maxDate(
    ctx.lastMetricDate.get(c.id),
    ctx.lastMarkerDate.get(c.id),
    lastSession,
    check,
    c.created_at.slice(0, 10),
  );

  const hasWorkoutPlan = (ctx.plannedDays.get(c.id) ?? 0) > 0;
  const hasDiet = ctx.hasDietPlan.has(c.id);

  const compliance = computeCompliance({
    plannedDaysPerWeek: ctx.plannedDays.has(c.id) ? ctx.plannedDays.get(c.id)! : null,
    hasDietPlan: hasDiet,
    trainedDaysThisWeek: ctx.weekTrainDays.get(c.id)?.size ?? 0,
    loggedDaysThisWeek: ctx.weekDietDays.get(c.id)?.size ?? 0,
  });

  const realActivity = maxDate(ctx.lastMetricDate.get(c.id), ctx.lastMarkerDate.get(c.id), lastSession, check);
  const daysSinceActivity = realActivity
    ? Math.round((Date.now() - new Date(`${realActivity}T00:00:00`).getTime()) / 86_400_000)
    : null;
  const thisWeekActivity = ctx.weekActivity.get(c.id)?.size ?? 0;
  const baselineWeeklyAvg = (ctx.baselineActivity.get(c.id)?.size ?? 0) / 3;
  const loggingRatioVsBaseline = baselineWeeklyAvg > 0 ? thisWeekActivity / baselineWeeklyAvg : null;

  const markerOutOfRange = ctx.markerOutByClient.has(c.id);
  const goalOverdue = ctx.goalOverdueByClient.has(c.id);

  const risk = computeRisk({
    consentMissing: !c.consent_given,
    daysSinceActivity,
    loggingRatioVsBaseline,
    noCheckInThisWeek: !(check && check >= ctx.weekCutoff),
    markerOutOfRange,
    goalOverdue,
    missedThisWeek: ctx.missedThisWeek.get(c.id)?.size ?? 0,
  });

  return {
    id: c.id,
    full_name: c.full_name,
    sex: c.sex,
    date_of_birth: c.date_of_birth,
    status: c.status as ClientStatus,
    phone: c.phone,
    email: c.email,
    consent_given: c.consent_given,
    latestWeight,
    weightDelta,
    weightSpark: w.slice(-8),
    lastActivity,
    lastSessionDate: lastSession,
    lastCheckIn: check,
    activeGoals: ctx.activeGoalsByClient.get(c.id) ?? 0,
    compliance,
    risk,
    markerOutOfRange,
    goalOverdue,
    noActivePlan: !hasWorkoutPlan && !hasDiet,
    goalDueSoon: ctx.goalDueSoonByClient.get(c.id) ?? null,
  };
}

/** At-risk first, then by most recent activity — the coaching priority order. */
function byRiskThenActivity(a: ClientBoardItem, b: ClientBoardItem): number {
  const r = RISK_RANK[a.risk.tier] - RISK_RANK[b.risk.tier];
  if (r !== 0) return r;
  return (a.lastActivity ?? "") < (b.lastActivity ?? "") ? 1 : -1;
}

/**
 * The client board for the Clients roster, filtered by status. Shares the exact
 * aggregation and per-client signals the dashboard uses.
 */
export async function getClientBoard(
  status: ClientStatus | "all" = "active",
): Promise<ClientBoardItem[]> {
  const ctx = await loadBoardContext();
  const clients = status === "all" ? ctx.allClients : ctx.allClients.filter((c) => c.status === status);
  return clients.map((c) => buildBoardItem(c, ctx)).sort(byRiskThenActivity);
}

export async function getTrainerDashboard(): Promise<DashboardData> {
  const ctx = await loadBoardContext();
  const active = ctx.allClients.filter((c) => c.status === "active");
  const board = active.map((c) => buildBoardItem(c, ctx)).sort(byRiskThenActivity);

  const nm = (id: string) => ctx.nameById.get(id) ?? "Client";

  // Review queue (pending diet check-ins), grouped by client, newest first.
  const reviewByClient = new Map<string, { days: Set<string>; latest: string }>();
  for (const s of ctx.submissions) {
    const e = reviewByClient.get(s.client_id) ?? { days: new Set<string>(), latest: s.logged_on };
    e.days.add(s.logged_on);
    e.latest = maxDate(e.latest, s.logged_on)!;
    reviewByClient.set(s.client_id, e);
  }
  const reviews: ReviewItem[] = [...reviewByClient.entries()]
    .map(([clientId, e]) => ({
      clientId,
      clientName: nm(clientId),
      days: e.days.size,
      latest: e.latest,
    }))
    .sort((a, b) => (a.latest < b.latest ? 1 : -1));

  // Stats.
  const sessionsThisWeek = ctx.sessions.filter((s) => s.performed_on >= ctx.weekCutoff).length;
  const goalsAchieved = ctx.goals.filter((g) => g.status === "achieved").length;

  // Activity feed (merge recent rows across tables).
  const activity: ActivityItem[] = [];
  for (const s of ctx.sessions.slice(0, 8))
    activity.push({ clientId: s.client_id, clientName: nm(s.client_id), icon: "dumbbell", label: `Logged ${s.title ?? "a training session"}`, at: s.created_at });
  for (const m of ctx.markers.slice(0, 8))
    activity.push({ clientId: m.client_id, clientName: nm(m.client_id), icon: "pulse", label: `Recorded ${markerLabel(m.marker_key, m.custom_name)}`, at: m.created_at });
  for (const p of ctx.photos.slice(0, 6))
    activity.push({ clientId: p.client_id, clientName: nm(p.client_id), icon: "camera", label: "Added a progress photo", at: p.created_at });
  const recentMetricRows = [...ctx.metrics].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1)).slice(0, 8);
  for (const m of recentMetricRows)
    activity.push({ clientId: m.client_id, clientName: nm(m.client_id), icon: "scale", label: "Updated body metrics", at: m.measured_on });
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    stats: {
      activeClients: active.length,
      archived: ctx.allClients.length - active.length,
      sessionsThisWeek,
      goalsAchieved,
      pendingReviews: ctx.submissions.length,
    },
    board,
    reviews: reviews.slice(0, 6),
    activity: activity.slice(0, 8),
  };
}
