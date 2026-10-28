import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/constants";
import { progressPct } from "@/lib/progress";
import { BODY_METRIC_FIELDS, METRIC_BY_KEY } from "@/lib/catalog/metrics";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import type { ProgressReport } from "@/lib/types";

export interface ReportPoint {
  date: string;
  value: number;
}
export type ReportOutcome = "ok" | "not_found" | "revoked" | "expired";

export interface SummaryMetric {
  latest: number;
  change: number | null;
  unit: string;
}
export interface ReportMarker {
  label: string;
  value: number;
  unit: string | null;
  measured_on: string;
  tone: "ok" | "watch" | null;
}
export interface ReportGoal {
  title: string;
  category: string;
  status: string;
  pct: number | null;
  current: number | null;
  target: number | null;
  unit: string | null;
}
export interface ReportPhoto {
  url: string;
  caption: string | null;
  taken_on: string;
}

export interface ReportData {
  report: ProgressReport;
  businessName: string | null;
  clientName: string;
  periodLabel: string;
  rangeStart: string | null;
  rangeEnd: string;
  summary: {
    weight?: SummaryMetric;
    bodyFat?: SummaryMetric;
    waist?: SummaryMetric;
    goalsAchieved: number;
    activeGoals: number;
    sessions: number;
    volumeKg: number;
  };
  metricSeries: Record<string, ReportPoint[]>;
  metricMeta: { key: string; label: string; unit: string }[];
  markers: ReportMarker[];
  goals: ReportGoal[];
  photos: ReportPhoto[];
  nutrition: ReportNutrition | null;
}

export interface ReportNutrition {
  planName: string | null;
  calorieTarget: number | null;
  proteinTarget: number | null;
  daysLogged: number;
  avgCalories: number | null;
  avgProtein: number | null;
  calorieSeries: ReportPoint[];
}

const PERIOD_MONTHS: Record<string, number | null> = { "3m": 3, "6m": 6, "12m": 12, all: null };
const PERIOD_LABEL: Record<string, string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  all: "All time",
};

export async function resolveReport(
  token: string,
): Promise<{ status: ReportOutcome; report?: ProgressReport }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("progress_reports")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { status: "not_found" };
  const report = data as ProgressReport;
  if (report.revoked) return { status: "revoked" };
  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return { status: "expired" };
  }
  return { status: "ok", report };
}

export async function recordReportView(id: string, current: number): Promise<void> {
  const admin = createAdminClient();
  await admin.from("progress_reports").update({ view_count: current + 1 }).eq("id", id);
}

export async function buildReportData(report: ProgressReport): Promise<ReportData | null> {
  const admin = createAdminClient();
  const today = new Date();
  const rangeEnd = today.toISOString().slice(0, 10);
  const months = PERIOD_MONTHS[report.period];
  let rangeStart: string | null = null;
  if (months !== null) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - months);
    rangeStart = d.toISOString().slice(0, 10);
  }

  const [clientRes, trainerRes] = await Promise.all([
    admin.from("clients").select("full_name, sex, date_of_birth").eq("id", report.client_id).maybeSingle(),
    admin.from("trainers").select("business_name, full_name").eq("id", report.trainer_id).maybeSingle(),
  ]);
  if (!clientRes.data) return null;

  // Apply the period's lower bound only when the period is not "all".
  const withRange = <T,>(q: T, col: string): T =>
    rangeStart ? ((q as { gte: (c: string, v: string) => T }).gte(col, rangeStart)) : q;

  const [metricsRes, markersRes, goalsRes, sessionsRes, dietLogsRes, dietPlanRes] = await Promise.all([
    withRange(admin.from("body_metrics").select("*").eq("client_id", report.client_id), "measured_on").order("measured_on", { ascending: true }),
    withRange(admin.from("health_markers").select("*").eq("client_id", report.client_id), "measured_on").order("measured_on", { ascending: false }),
    admin.from("goals").select("*").eq("client_id", report.client_id),
    withRange(admin.from("workout_sessions").select("*, sets:workout_sets(*)").eq("client_id", report.client_id), "performed_on").order("performed_on", { ascending: true }),
    withRange(admin.from("diet_logs").select("logged_on, entries:diet_log_entries(calories, protein_g)").eq("client_id", report.client_id), "logged_on").order("logged_on", { ascending: true }),
    admin.from("diet_plans").select("name, target_calories, target_protein_g").eq("client_id", report.client_id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const metrics = (metricsRes.data ?? []) as Record<string, number | string | null>[];
  const markersRaw = (markersRes.data ?? []) as {
    marker_key: string; custom_name: string | null; value: number; unit: string | null; measured_on: string;
  }[];
  const goalsRaw = (goalsRes.data ?? []) as {
    title: string; category: string; status: string; metric_key: string | null;
    start_value: number | null; target_value: number | null; target_unit: string | null;
  }[];
  const sessions = (sessionsRes.data ?? []) as { sets: { reps: number | null; weight_kg: number | null }[] }[];

  // ---- metric series + summary ----
  const metricSeries: Record<string, ReportPoint[]> = {};
  const metricMeta: { key: string; label: string; unit: string }[] = [];
  const summary: ReportData["summary"] = { goalsAchieved: 0, activeGoals: 0, sessions: 0, volumeKg: 0 };

  for (const f of BODY_METRIC_FIELDS) {
    if (f.key === "height_cm") continue;
    const pts = metrics
      .filter((m) => m[f.key] != null)
      .map((m) => ({ date: String(m.measured_on), value: Number(m[f.key]) }));
    if (pts.length) {
      metricSeries[f.key] = pts;
      metricMeta.push({ key: f.key, label: f.label, unit: f.unit });
    }
  }
  const mkSummary = (key: string): SummaryMetric | undefined => {
    const pts = metricSeries[key];
    if (!pts?.length) return undefined;
    const latest = pts[pts.length - 1].value;
    const change = pts.length >= 2 ? +(latest - pts[0].value).toFixed(1) : null;
    return { latest, change, unit: METRIC_BY_KEY[key]?.unit ?? "" };
  };
  summary.weight = mkSummary("weight_kg");
  summary.bodyFat = mkSummary("body_fat_pct");
  summary.waist = mkSummary("waist_cm");

  // ---- markers (latest per key, with range) ----
  const seen = new Set<string>();
  const markers: ReportMarker[] = [];
  for (const m of markersRaw) {
    const key = m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (seen.has(key)) continue;
    seen.add(key);
    const def = MARKER_BY_KEY[m.marker_key];
    let tone: "ok" | "watch" | null = null;
    if (def) {
      const out =
        (def.refLow !== undefined && Number(m.value) < def.refLow) ||
        (def.refHigh !== undefined && Number(m.value) > def.refHigh);
      tone = out ? "watch" : "ok";
    }
    markers.push({
      label: markerLabel(m.marker_key, m.custom_name),
      value: Number(m.value),
      unit: m.unit,
      measured_on: m.measured_on,
      tone,
    });
  }

  // latest value for a metric_key (metrics or markers) for goal progress
  const latestFor = (key: string): number | null => {
    if (METRIC_BY_KEY[key]) {
      const pts = metricSeries[key];
      return pts?.length ? pts[pts.length - 1].value : null;
    }
    const mk = markersRaw.find((m) => m.marker_key === key);
    return mk ? Number(mk.value) : null;
  };

  // ---- goals ----
  const goals: ReportGoal[] = goalsRaw.map((g) => {
    const lower = (g.metric_key && METRIC_BY_KEY[g.metric_key]?.lowerIsBetter) || false;
    const current = g.metric_key ? latestFor(g.metric_key) : null;
    const pct = g.metric_key ? progressPct(g.start_value, g.target_value, current, lower) : null;
    if (g.status === "achieved") summary.goalsAchieved++;
    if (g.status === "active") summary.activeGoals++;
    return {
      title: g.title,
      category: g.category,
      status: g.status,
      pct,
      current,
      target: g.target_value,
      unit: g.target_unit,
    };
  });

  // ---- training ----
  summary.sessions = sessions.length;
  summary.volumeKg = Math.round(
    sessions.reduce(
      (t, s) =>
        t + s.sets.reduce((v, x) => v + (x.reps != null && x.weight_kg != null ? Number(x.reps) * Number(x.weight_kg) : 0), 0),
      0,
    ),
  );

  // ---- nutrition (diet-log adherence over the period) ----
  const dietRows = (dietLogsRes.data ?? []) as {
    logged_on: string;
    entries: { calories: number | null; protein_g: number | null }[];
  }[];
  const dietPlan = dietPlanRes.data as
    | { name: string; target_calories: number | null; target_protein_g: number | null }
    | null;

  let nutrition: ReportNutrition | null = null;
  if (dietRows.length || dietPlan) {
    const calorieSeries: ReportPoint[] = [];
    let calSum = 0;
    let calDays = 0;
    let proSum = 0;
    let proDays = 0;
    for (const row of dietRows) {
      let cal = 0;
      let pro = 0;
      for (const e of row.entries ?? []) {
        cal += e.calories != null ? Number(e.calories) : 0;
        pro += e.protein_g != null ? Number(e.protein_g) : 0;
      }
      if (cal > 0) {
        calorieSeries.push({ date: row.logged_on, value: Math.round(cal) });
        calSum += cal;
        calDays++;
      }
      if (pro > 0) {
        proSum += pro;
        proDays++;
      }
    }
    nutrition = {
      planName: dietPlan?.name ?? null,
      calorieTarget: dietPlan?.target_calories ?? null,
      proteinTarget: dietPlan?.target_protein_g ?? null,
      daysLogged: dietRows.length,
      avgCalories: calDays ? Math.round(calSum / calDays) : null,
      avgProtein: proDays ? Math.round(proSum / proDays) : null,
      calorieSeries,
    };
  }

  // ---- photos ----
  let photos: ReportPhoto[] = [];
  if (report.include_photos) {
    const photoQ = withRange(
      admin.from("client_photos").select("storage_path, caption, taken_on").eq("client_id", report.client_id),
      "taken_on",
    ).order("taken_on", { ascending: true });
    const { data: rows } = await photoQ;
    const list = (rows ?? []) as { storage_path: string; caption: string | null; taken_on: string }[];
    if (list.length) {
      const { data: signed } = await admin.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(list.map((p) => p.storage_path), 60 * 60);
      const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl ?? null]));
      photos = list
        .map((p) => ({ url: urlByPath.get(p.storage_path) ?? "", caption: p.caption, taken_on: p.taken_on }))
        .filter((p) => p.url);
    }
  }

  return {
    report,
    businessName: trainerRes.data?.business_name || trainerRes.data?.full_name || null,
    clientName: clientRes.data.full_name as string,
    periodLabel: PERIOD_LABEL[report.period],
    rangeStart,
    rangeEnd,
    summary,
    metricSeries,
    metricMeta,
    markers,
    goals,
    photos,
    nutrition,
  };
}
