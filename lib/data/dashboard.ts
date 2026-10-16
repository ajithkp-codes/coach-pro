import { authed } from "./session";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";

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

export interface AttentionItem {
  clientId: string;
  clientName: string;
  tone: "warning" | "danger" | "neutral";
  label: string;
}

export interface ActivityItem {
  clientId: string;
  clientName: string;
  icon: "scale" | "pulse" | "dumbbell" | "camera" | "target";
  label: string;
  at: string;
}

export interface DashboardData {
  stats: {
    activeClients: number;
    archived: number;
    sessionsThisWeek: number;
    goalsAchieved: number;
  };
  cards: ClientCardData[];
  attention: AttentionItem[];
  activity: ActivityItem[];
}

const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const maxDate = (...ds: (string | null | undefined)[]) =>
  ds.filter(Boolean).sort().at(-1) ?? null;

export async function getTrainerDashboard(): Promise<DashboardData> {
  const { supabase } = await authed();

  const [clientsRes, metricsRes, markersRes, goalsRes, sessionsRes, photosRes] =
    await Promise.all([
      supabase.from("clients").select("id, full_name, sex, date_of_birth, status, consent_given, created_at"),
      supabase.from("body_metrics").select("client_id, measured_on, weight_kg, created_at").order("measured_on", { ascending: true }),
      supabase.from("health_markers").select("client_id, marker_key, custom_name, value, measured_on, created_at").order("created_at", { ascending: false }),
      supabase.from("goals").select("client_id, title, status, target_date, metric_key, target_value, created_at"),
      supabase.from("workout_sessions").select("client_id, performed_on, title, created_at").order("created_at", { ascending: false }),
      supabase.from("client_photos").select("client_id, taken_on, created_at").order("created_at", { ascending: false }),
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

  const metrics = (metricsRes.data ?? []) as {
    client_id: string;
    measured_on: string;
    weight_kg: number | null;
  }[];
  const markers = (markersRes.data ?? []) as {
    client_id: string;
    marker_key: string;
    custom_name: string | null;
    value: number;
    measured_on: string;
    created_at: string;
  }[];
  const goals = (goalsRes.data ?? []) as {
    client_id: string;
    title: string;
    status: string;
    target_date: string | null;
  }[];
  const sessions = (sessionsRes.data ?? []) as {
    client_id: string;
    performed_on: string;
    title: string | null;
    created_at: string;
  }[];
  const photos = (photosRes.data ?? []) as {
    client_id: string;
    taken_on: string;
    created_at: string;
  }[];

  // Per-client weight series (ascending).
  const weightsByClient = new Map<string, number[]>();
  const lastMetricDate = new Map<string, string>();
  for (const m of metrics) {
    if (m.weight_kg != null) {
      const arr = weightsByClient.get(m.client_id) ?? [];
      arr.push(Number(m.weight_kg));
      weightsByClient.set(m.client_id, arr);
    }
    lastMetricDate.set(
      m.client_id,
      maxDate(lastMetricDate.get(m.client_id), m.measured_on)!,
    );
  }

  const lastMarkerDate = new Map<string, string>();
  for (const m of markers) {
    lastMarkerDate.set(
      m.client_id,
      maxDate(lastMarkerDate.get(m.client_id), m.measured_on)!,
    );
  }
  const lastSessionDate = new Map<string, string>();
  for (const s of sessions) {
    lastSessionDate.set(
      s.client_id,
      maxDate(lastSessionDate.get(s.client_id), s.performed_on)!,
    );
  }

  const activeGoalsByClient = new Map<string, number>();
  for (const g of goals) {
    if (g.status === "active") {
      activeGoalsByClient.set(
        g.client_id,
        (activeGoalsByClient.get(g.client_id) ?? 0) + 1,
      );
    }
  }

  const cards: ClientCardData[] = active
    .map((c) => {
      const w = weightsByClient.get(c.id) ?? [];
      const latestWeight = w.length ? w[w.length - 1] : null;
      const weightDelta = w.length >= 2 ? +(w[w.length - 1] - w[w.length - 2]).toFixed(1) : null;
      const lastActivity = maxDate(
        lastMetricDate.get(c.id),
        lastMarkerDate.get(c.id),
        lastSessionDate.get(c.id),
        c.created_at.slice(0, 10),
      );
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
        lastSessionDate: lastSessionDate.get(c.id) ?? null,
        activeGoals: activeGoalsByClient.get(c.id) ?? 0,
      };
    })
    .sort((a, b) => (a.lastActivity ?? "") < (b.lastActivity ?? "") ? 1 : -1);

  // Stats
  const weekCutoff = daysAgoISO(7);
  const sessionsThisWeek = sessions.filter((s) => s.performed_on >= weekCutoff).length;
  const goalsAchieved = goals.filter((g) => g.status === "achieved").length;

  // Attention items
  const attention: AttentionItem[] = [];
  const staleCutoff = daysAgoISO(21);
  const today = daysAgoISO(0);
  for (const c of active) {
    const la = maxDate(
      lastMetricDate.get(c.id),
      lastMarkerDate.get(c.id),
      lastSessionDate.get(c.id),
    );
    if (!c.consent_given) {
      attention.push({ clientId: c.id, clientName: c.full_name, tone: "warning", label: "Consent not recorded" });
    }
    if (!la || la < staleCutoff) {
      attention.push({ clientId: c.id, clientName: c.full_name, tone: "neutral", label: la ? "No update in 3+ weeks" : "No data recorded yet" });
    }
  }
  // Latest marker per client+key out of range
  const seenMarker = new Set<string>();
  for (const m of markers) {
    const key = `${m.client_id}:${m.marker_key}:${m.custom_name ?? ""}`;
    if (seenMarker.has(key)) continue; // markers sorted desc → first is latest
    seenMarker.add(key);
    const def = MARKER_BY_KEY[m.marker_key];
    if (!def) continue;
    const out =
      (def.refLow !== undefined && Number(m.value) < def.refLow) ||
      (def.refHigh !== undefined && Number(m.value) > def.refHigh);
    if (out) {
      attention.push({
        clientId: m.client_id,
        clientName: nameById.get(m.client_id) ?? "Client",
        tone: "danger",
        label: `${markerLabel(m.marker_key, m.custom_name)} out of range`,
      });
    }
  }
  // Overdue active goals
  for (const g of goals) {
    if (g.status === "active" && g.target_date && g.target_date < today) {
      attention.push({
        clientId: g.client_id,
        clientName: nameById.get(g.client_id) ?? "Client",
        tone: "warning",
        label: `Goal overdue: ${g.title}`,
      });
    }
  }

  // Activity feed (merge recent rows across tables)
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
    activity.push({ clientId: m.client_id, clientName: nm(m.client_id), icon: "scale", label: "Updated body metrics", at: `${m.measured_on}T12:00:00Z` });

  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  return {
    stats: {
      activeClients: active.length,
      archived: allClients.length - active.length,
      sessionsThisWeek,
      goalsAchieved,
    },
    cards,
    attention: attention.slice(0, 8),
    activity: activity.slice(0, 8),
  };
}
