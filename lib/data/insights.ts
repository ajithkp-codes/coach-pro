import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import { formatNumber } from "@/lib/format";
import type { BodyMetric, HealthMarker, Goal, WorkoutSessionWithSets } from "@/lib/types";

export type InsightTone = "positive" | "warning" | "neutral";
export type InsightIcon = "scale" | "dumbbell" | "pulse" | "target" | "alert" | "checkCircle";

export interface Insight {
  text: string;
  tone: InsightTone;
  icon: InsightIcon;
}

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

const todayISO = () => new Date().toISOString().slice(0, 10);

export function computeInsights(
  metrics: BodyMetric[],
  markers: HealthMarker[],
  goals: Goal[],
  sessions: WorkoutSessionWithSets[],
): Insight[] {
  const insights: Insight[] = [];
  const today = todayISO();

  // Weight trend over last ~4 weeks
  const withWeight = [...metrics].filter((m) => m.weight_kg != null).sort(
    (a, b) => a.measured_on.localeCompare(b.measured_on),
  );
  if (withWeight.length >= 2) {
    const latest = withWeight[withWeight.length - 1];
    // find the reading closest to 4 weeks ago
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 28);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    const older = withWeight.find((m) => m.measured_on >= cutoffISO) ?? withWeight[0];
    const delta = +(Number(latest.weight_kg) - Number(older.weight_kg)).toFixed(1);
    const weeks = Math.round(daysBetween(older.measured_on, latest.measured_on) / 7);
    if (delta !== 0 && weeks > 0) {
      const sign = delta < 0 ? "↓" : "↑";
      const abs = Math.abs(delta);
      const period = weeks === 1 ? "1 week" : `${weeks} weeks`;
      insights.push({
        text: `Weight ${sign} ${abs} kg over ${period}`,
        tone: delta < 0 ? "positive" : "warning",
        icon: "scale",
      });
    }
  }

  // Latest out-of-range marker
  const seenKey = new Set<string>();
  const sortedMarkers = [...markers].sort((a, b) =>
    b.measured_on.localeCompare(a.measured_on),
  );
  for (const m of sortedMarkers) {
    const key = m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    const def = MARKER_BY_KEY[m.marker_key];
    if (!def) continue;
    const out =
      (def.refLow !== undefined && Number(m.value) < def.refLow) ||
      (def.refHigh !== undefined && Number(m.value) > def.refHigh);
    if (out) {
      insights.push({
        text: `${markerLabel(m.marker_key, m.custom_name)} out of range (${formatNumber(m.value, m.unit)})`,
        tone: "warning",
        icon: "pulse",
      });
    } else if (def.refLow !== undefined || def.refHigh !== undefined) {
      // only add a "in range" positive insight for the first/most prominent marker
      if (insights.filter((i) => i.icon === "pulse").length === 0) {
        insights.push({
          text: `${markerLabel(m.marker_key, m.custom_name)} in range (${formatNumber(m.value, m.unit)})`,
          tone: "positive",
          icon: "pulse",
        });
      }
    }
  }

  // Training recency
  const lastSession = sessions[0];
  if (lastSession) {
    const days = daysBetween(lastSession.performed_on, today);
    if (days === 0) {
      insights.push({ text: "Trained today", tone: "positive", icon: "dumbbell" });
    } else if (days <= 3) {
      insights.push({ text: `Last trained ${days} day${days === 1 ? "" : "s"} ago`, tone: "positive", icon: "dumbbell" });
    } else if (days <= 10) {
      insights.push({ text: `No training in ${days} days`, tone: "neutral", icon: "dumbbell" });
    } else {
      insights.push({ text: `No training in ${days} days`, tone: "warning", icon: "dumbbell" });
    }
  }

  // Goal summary
  const active = goals.filter((g) => g.status === "active");
  const overdue = active.filter((g) => g.target_date && g.target_date < today);
  if (overdue.length > 0) {
    insights.push({
      text: `${overdue.length} goal${overdue.length === 1 ? "" : "s"} past target date`,
      tone: "warning",
      icon: "target",
    });
  } else if (active.length > 0) {
    insights.push({
      text: `${active.length} active goal${active.length === 1 ? "" : "s"} on track`,
      tone: "positive",
      icon: "target",
    });
  }

  // Cap at 4 most relevant insights
  return insights.slice(0, 4);
}

/** Generate a plain-text progress summary the trainer can share via WhatsApp / copy-paste. */
export function generateProgressSummary(
  clientName: string,
  metrics: BodyMetric[],
  markers: HealthMarker[],
  goals: Goal[],
  sessions: WorkoutSessionWithSets[],
): string {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lines: string[] = [];

  lines.push(`Progress Summary — ${clientName}`);
  lines.push(`Generated: ${today}`);
  lines.push("");

  // Body metrics
  const latestMetric = [...metrics].sort((a, b) =>
    b.measured_on.localeCompare(a.measured_on),
  )[0];
  if (latestMetric) {
    const parts: string[] = [];
    if (latestMetric.weight_kg != null) parts.push(`Weight: ${formatNumber(latestMetric.weight_kg, "kg")}`);
    if (latestMetric.body_fat_pct != null) parts.push(`Body fat: ${formatNumber(latestMetric.body_fat_pct, "%")}`);
    if (latestMetric.waist_cm != null) parts.push(`Waist: ${formatNumber(latestMetric.waist_cm, "cm")}`);
    if (parts.length) {
      lines.push("Body metrics:");
      parts.forEach((p) => lines.push(`  ${p}`));
      lines.push("");
    }
  }

  // Health markers (latest per key)
  const seenKey = new Set<string>();
  const markerLines: string[] = [];
  for (const m of [...markers].sort((a, b) => b.measured_on.localeCompare(a.measured_on))) {
    const key = m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    const def = MARKER_BY_KEY[m.marker_key];
    const rangeNote = def
      ? ((def.refLow !== undefined && Number(m.value) < def.refLow) ||
          (def.refHigh !== undefined && Number(m.value) > def.refHigh)
          ? " ⚠️"
          : " ✓")
      : "";
    markerLines.push(`  ${markerLabel(m.marker_key, m.custom_name)}: ${formatNumber(m.value, m.unit)}${rangeNote}`);
  }
  if (markerLines.length) {
    lines.push("Health markers:");
    lines.push(...markerLines.slice(0, 6));
    lines.push("");
  }

  // Goals
  const activeGoals = goals.filter((g) => g.status === "active");
  const achieved = goals.filter((g) => g.status === "achieved");
  if (activeGoals.length || achieved.length) {
    lines.push("Goals:");
    activeGoals.slice(0, 5).forEach((g) => {
      const suffix = g.target_value != null ? ` (target: ${formatNumber(g.target_value, g.target_unit)})` : "";
      const overdue = g.target_date && g.target_date < new Date().toISOString().slice(0, 10) ? " ⚠️ overdue" : "";
      lines.push(`  • ${g.title}${suffix}${overdue}`);
    });
    if (achieved.length) lines.push(`  ${achieved.length} goal${achieved.length === 1 ? "" : "s"} achieved`);
    lines.push("");
  }

  // Training
  if (sessions.length) {
    const last = sessions[0];
    const days = Math.round(
      (new Date().getTime() - new Date(last.performed_on).getTime()) / 86_400_000,
    );
    const recency = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
    const monthCutoff = new Date();
    monthCutoff.setDate(monthCutoff.getDate() - 30);
    const monthCutoffISO = monthCutoff.toISOString().slice(0, 10);
    const sessionsThisMonth = sessions.filter((s) => s.performed_on >= monthCutoffISO).length;
    lines.push("Training:");
    lines.push(`  Last session: ${recency}${last.title ? ` (${last.title})` : ""}`);
    lines.push(`  Sessions this month: ${sessionsThisMonth}`);
    lines.push(`  Total sessions: ${sessions.length}`);
    lines.push("");
  }

  lines.push("— CoachPro");
  return lines.join("\n");
}
