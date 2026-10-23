import { authed } from "./session";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import {
  computeCompliance,
  computeRisk,
  type ClientCompliance,
  type RiskResult,
} from "./compliance";

export interface ClientCardData {
  id: string;
  full_name: string;
  sex: string;
  date_of_birth: string | null;
  consent_given: boolean;
  latestWeight: number | null;
  weightDelta: number | null;
  weightSpark: number[];
  lastActivity: string | null;
  lastSessionDate: string | null;
  activeGoals: number;
}

/** A client as shown on the dashboard health board — card data + coaching signals. */
export interface ClientBoardItem extends ClientCardData {
  /** Latest diet log / accepted submission date. */
  lastCheckIn: string | null;
  compliance: ClientCompliance;
  risk: RiskResult;
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
    /** Active clients who logged a session or diet log in the last 7 days. */
    loggingThisWeek: number;
    /** Average compliance score across active clients that have any active plan. */
    avgCompliance: number;
  };
  /** The roster, sorted at-risk first (the coaching priority order). */
  board: ClientBoardItem[];
  reviews: ReviewItem[];
  activity: ActivityItem[];
}

const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const maxDate = (...ds: (string | null | undefined)[]) =>
  ds.filter(Boolean).sort().at(-1) ?? null;

const RISK_RANK: Record<string, number> = { at_risk: 0, watch: 1, on_track: 2 };

export async function getTrainerDashboard(): Promise<DashboardData> {
  const { supabase } = await authed();

  const recentCutoff = daysAgoISO(90);
  const weekCutoff = daysAgoISO(7);
  const baselineCutoff = daysAgoISO(28);

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
    supabase.from("clients").select("id, full_name, sex, date_of_birth, status, consent_given, created_at"),
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

  type ClientRow = {
    id: string;
    full_name: string;
    sex: string;
    date_of_birth: string | null;
    status: string;
    consent_given: boolean;
    created_at: string;
  };
  const allClients = (clientsRes.data ?? []) as ClientRow[];
  const active = allClients.filter((c) => c.status === "active");
  const nameById = new Map(allClients.map((c) => [c.id, c.full_name]));

  const metrics = (metricsRes.data ?? []) as { client_id: string; measured_on: string; weight_kg: number | null }[];
  const markers = (markersRes.data ?? []) as { client_id: string; marker_key: string; custom_name: string | null; value: number; measured_on: string; created_at: string }[];
  const goals = (goalsRes.data ?? []) as { client_id: string; title: string; status: string; target_date: string | null }[];
  const sessions = (sessionsRes.data ?? []) as { client_id: string; performed_on: string; title: string | null; created_at: string }[];
  const photos = (photosRes.data ?? []) as { client_id: string; taken_on: string; created_at: string }[];
  const submissions = (submissionsRes.data ?? []) as { client_id: string; logged_on: string }[];
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
  // Latest-per-key marker out of range, and overdue active goals, per client.
  const today = daysAgoISO(0);
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
  const goalOverdueByClient = new Set<string>();
  for (const g of goals) {
    if (g.status === "active" && g.target_date && g.target_date < today) goalOverdueByClient.add(g.client_id);
  }

  // Per-client distinct days this week, by signal, plus an engagement baseline.
  // weekTrainDays  → logged workout sessions (for workout compliance)
  // weekDietDays   → diet logs (for nutrition compliance)
  // weekActivity / baselineActivity → any engagement, for the drop-off ratio
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

  // Build the board.
  const board: ClientBoardItem[] = active.map((c) => {
    const w = weightsByClient.get(c.id) ?? [];
    const latestWeight = w.length ? w[w.length - 1] : null;
    const weightDelta = w.length >= 2 ? +(w[w.length - 1] - w[w.length - 2]).toFixed(1) : null;
    const lastSession = lastSessionDate.get(c.id) ?? null;
    const check = lastCheckIn.get(c.id) ?? null;
    const lastActivity = maxDate(
      lastMetricDate.get(c.id),
      lastMarkerDate.get(c.id),
      lastSession,
      check,
      c.created_at.slice(0, 10),
    );

    const compliance = computeCompliance({
      plannedDaysPerWeek: plannedDays.has(c.id) ? plannedDays.get(c.id)! : null,
      hasDietPlan: hasDietPlan.has(c.id),
      trainedDaysThisWeek: weekTrainDays.get(c.id)?.size ?? 0,
      loggedDaysThisWeek: weekDietDays.get(c.id)?.size ?? 0,
    });

    const realActivity = maxDate(lastMetricDate.get(c.id), lastMarkerDate.get(c.id), lastSession, check);
    const daysSinceActivity = realActivity
      ? Math.round((Date.now() - new Date(`${realActivity}T00:00:00`).getTime()) / 86_400_000)
      : null;
    // Engagement drop-off: this week's active days vs the client's prior-3-week average.
    const thisWeekActivity = weekActivity.get(c.id)?.size ?? 0;
    const baselineWeeklyAvg = (baselineActivity.get(c.id)?.size ?? 0) / 3;
    const loggingRatioVsBaseline = baselineWeeklyAvg > 0 ? thisWeekActivity / baselineWeeklyAvg : null;

    const risk = computeRisk({
      consentMissing: !c.consent_given,
      daysSinceActivity,
      loggingRatioVsBaseline,
      noCheckInThisWeek: !(check && check >= weekCutoff),
      markerOutOfRange: markerOutByClient.has(c.id),
      goalOverdue: goalOverdueByClient.has(c.id),
      missedThisWeek: missedThisWeek.get(c.id)?.size ?? 0,
    });

    return {
      id: c.id,
      full_name: c.full_name,
      sex: c.sex,
      date_of_birth: c.date_of_birth,
      consent_given: c.consent_given,
      latestWeight,
      weightDelta,
      weightSpark: w.slice(-8),
      lastActivity,
      lastSessionDate: lastSession,
      lastCheckIn: check,
      activeGoals: activeGoalsByClient.get(c.id) ?? 0,
      compliance,
      risk,
    };
  });
  // At-risk first, then by most recent activity.
  board.sort((a, b) => {
    const r = RISK_RANK[a.risk.tier] - RISK_RANK[b.risk.tier];
    if (r !== 0) return r;
    return (a.lastActivity ?? "") < (b.lastActivity ?? "") ? 1 : -1;
  });

  // Review queue (pending diet check-ins), grouped by client, newest first.
  const reviewByClient = new Map<string, { days: Set<string>; latest: string }>();
  for (const s of submissions) {
    const e = reviewByClient.get(s.client_id) ?? { days: new Set<string>(), latest: s.logged_on };
    e.days.add(s.logged_on);
    e.latest = maxDate(e.latest, s.logged_on)!;
    reviewByClient.set(s.client_id, e);
  }
  const reviews: ReviewItem[] = [...reviewByClient.entries()]
    .map(([clientId, e]) => ({
      clientId,
      clientName: nameById.get(clientId) ?? "Client",
      days: e.days.size,
      latest: e.latest,
    }))
    .sort((a, b) => (a.latest < b.latest ? 1 : -1));

  // Stats.
  const sessionsThisWeek = sessions.filter((s) => s.performed_on >= weekCutoff).length;
  const goalsAchieved = goals.filter((g) => g.status === "achieved").length;
  const loggingThisWeek = board.filter((c) => (weekActivity.get(c.id)?.size ?? 0) > 0).length;
  const scored = board.filter((c) => c.compliance.workoutPct !== null || c.compliance.nutritionPct !== null);
  const avgCompliance = scored.length
    ? Math.round(scored.reduce((sum, c) => sum + c.compliance.score, 0) / scored.length)
    : 0;

  // Activity feed (merge recent rows across tables).
  const activity: ActivityItem[] = [];
  const nm = (id: string) => nameById.get(id) ?? "Client";
  for (const s of sessions.slice(0, 8))
    activity.push({ clientId: s.client_id, clientName: nm(s.client_id), icon: "dumbbell", label: `Logged ${s.title ?? "a training session"}`, at: s.created_at });
  for (const m of markers.slice(0, 8))
    activity.push({ clientId: m.client_id, clientName: nm(m.client_id), icon: "pulse", label: `Recorded ${markerLabel(m.marker_key, m.custom_name)}`, at: m.created_at });
  for (const p of photos.slice(0, 6))
    activity.push({ clientId: p.client_id, clientName: nm(p.client_id), icon: "camera", label: "Added a progress photo", at: p.created_at });
  const recentMetricRows = [...metrics].sort((a, b) => (a.measured_on < b.measured_on ? 1 : -1)).slice(0, 8);
  for (const m of recentMetricRows)
    activity.push({ clientId: m.client_id, clientName: nm(m.client_id), icon: "scale", label: "Updated body metrics", at: m.measured_on });
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    stats: {
      activeClients: active.length,
      archived: allClients.length - active.length,
      sessionsThisWeek,
      goalsAchieved,
      pendingReviews: submissions.length,
      loggingThisWeek,
      avgCompliance,
    },
    board,
    reviews: reviews.slice(0, 6),
    activity: activity.slice(0, 8),
  };
}
