"use server";

import { z } from "zod";
import { authed } from "@/lib/data/session";
import { planDaySchema } from "@/lib/validation";
import type { PlanDay } from "@/lib/types";
import { getModality, DEFAULT_MODALITY, type Modality } from "@/lib/catalog/modalities";
import { movementsForModality } from "@/lib/catalog/movements";
import { callAi, isAiConfigured } from "@/lib/ai/provider";
import { enforceAiDailyLimit } from "@/lib/data/rate-limit";
import { getSubscription, planOf } from "@/lib/data/billing";
import { canGenerateAi, aiDailyLimitFor, getTier } from "@/lib/catalog/plans";
import {
  getClientTrainingSnapshot,
  type ClientTrainingSnapshot,
} from "@/lib/data/training-snapshot";
import type { PlanBrief } from "@/lib/training/plan-brief";

export interface GeneratePlanState {
  ok?: boolean;
  days?: PlanDay[];
  error?: string;
}

export interface GeneratePlanInput {
  clientId: string;
  modality?: Modality;
  brief: PlanBrief;
  /** Optional per-request key; when set, the trainer pays and the cap is skipped. */
  apiKey?: string;
}

const draftSchema = z.object({ days: z.array(planDaySchema).min(1).max(14) });

/** A modality-specific system prompt: the right role, item shape and field rules,
 * plus the modality's own movement vocabulary so names match the catalog. */
function systemFor(modality: Modality): string {
  const def = getModality(modality);
  const fields = def.planColumns.map((c) => c.field);
  const example: Record<string, string> = { exercise_name: "<movement>" };
  for (const f of fields) example[f] = "";
  const fieldList = fields.map((f) => `\`${f}\``).join(", ");
  const library = movementsForModality(modality)
    .slice(0, 48)
    .map((m) => m.name)
    .join(", ");

  return [
    `You are an experienced, safety-first ${def.label} coach drafting a weekly ${def.label.toLowerCase()} plan for one specific client.`,
    "Respond with ONLY a single JSON object — no prose, no markdown code fences.",
    `Shape: {"days":[{"day":"Mon","title":"${def.itemNoun} focus","items":[${JSON.stringify(example)}]}]}`,
    "Rules: `day` is a short weekday label (Mon, Tue, …). `title` is the session focus.",
    `Each item has \`exercise_name\` plus these string fields: ${fieldList}. Leave a field "" when it doesn't apply.`,
    library
      ? `Prefer these ${def.label} movements where they fit: ${library}. You may add other real, common ones.`
      : "Use common, real movement names.",
    `Produce exactly the requested number of training days (rest days omitted). Each day should have 4–7 ${def.itemNoun.toLowerCase()}s suited to the client below.`,
    "Honour every constraint in the client brief. Safety comes before everything: never prescribe a movement that would aggravate a stated injury or condition — regress, substitute, or omit it.",
  ].join(" ");
}

/** Human-readable constraint lines derived from flagged health markers. */
function markerCautions(snapshot: ClientTrainingSnapshot | null): string[] {
  if (!snapshot) return [];
  const lines: string[] = [];
  for (const m of snapshot.flaggedMarkers) {
    const v = `${m.value}${m.unit ? ` ${m.unit}` : ""}`;
    lines.push(`${m.label} is ${m.direction} (${v})`);
  }
  return lines;
}

/** Explicit, high-value safety rules for conditions/markers the model must respect. */
function safetyRules(brief: PlanBrief, snapshot: ClientTrainingSnapshot | null): string[] {
  const rules: string[] = [];
  const has = (needle: string) =>
    brief.conditions.some((c) => c.toLowerCase().includes(needle)) ||
    (snapshot?.flaggedMarkers ?? []).some((m) => m.label.toLowerCase().includes(needle));

  const inj = brief.injuries.map((i) => i.toLowerCase());
  if (inj.some((i) => i.includes("back")))
    rules.push("Lower back: avoid heavy loaded spinal flexion and max-effort deadlifts; prefer hip-hinge regressions, supported/neutral-spine and core-stability work.");
  if (inj.some((i) => i.includes("knee")))
    rules.push("Knee: limit deep knee flexion and high-impact/plyometric work; prefer controlled range, box variations and low-impact options.");
  if (inj.some((i) => i.includes("shoulder")))
    rules.push("Shoulder: avoid heavy overhead and behind-the-neck pressing; prefer neutral-grip, scapular-stability and controlled ranges.");

  if (has("blood pressure") || has("hypertension"))
    rules.push("Raised blood pressure: avoid heavy isometrics, breath-holding/Valsalva and max-effort overhead lifts; keep rest adequate and continuous breathing.");
  if (has("pregnan") || has("postpartum"))
    rules.push("Pregnant/postpartum: avoid supine work beyond early pregnancy, heavy intra-abdominal bracing, deep core flexion and fall-risk movements; favour pelvic-floor-safe exercises.");
  if (has("diabet"))
    rules.push("Diabetes: include a proper warm-up, favour steady controlled intensity, and note hydration/blood-sugar awareness in the plan notes where relevant.");
  if (has("heart"))
    rules.push("Heart condition: keep intensity moderate and progressive, avoid max-effort straining, and build in recovery.");

  if (brief.returning)
    rules.push("Returning after a break: start conservatively (lower volume/intensity) and ramp up gradually.");
  return rules;
}

/** Build the user message: the client picture + the trainer's brief + constraints. */
function buildUserPrompt(
  brief: PlanBrief,
  snapshot: ClientTrainingSnapshot | null,
  days: number,
  itemNoun: string,
): string {
  const lines: string[] = [];

  // Who this is for (from the client record — the authoritative physical picture).
  if (snapshot) {
    const who: string[] = [];
    if (snapshot.age != null) who.push(`${snapshot.age}y`);
    if (snapshot.sex && snapshot.sex !== "unspecified") who.push(snapshot.sex);
    if (snapshot.weightKg != null) who.push(`${snapshot.weightKg} kg`);
    if (snapshot.heightCm != null) who.push(`${snapshot.heightCm} cm`);
    lines.push(`Client: ${who.join(", ") || "no demographics on file"}.`);
    const cautions = markerCautions(snapshot);
    if (cautions.length) lines.push(`Flagged health markers: ${cautions.join("; ")}.`);
    if (snapshot.openGoals.length)
      lines.push(
        `Existing goals on record: ${snapshot.openGoals
          .map((g) => (g.targetDate ? `${g.title} (by ${g.targetDate})` : g.title))
          .join("; ")}.`,
      );
  }

  // The trainer's brief.
  const focus = [brief.goalFocus.join(", "), brief.goal.trim()].filter(Boolean).join(" — ");
  lines.push(`Goal: ${focus || "general fitness"}.`);
  if (brief.deadline) lines.push(`Target date: ${brief.deadline}.`);
  lines.push(
    `Schedule: ${days} training day(s) per week, about ${brief.sessionMinutes} minutes per session.`,
  );
  lines.push(`Experience level: ${brief.experience}.`);
  if (brief.equipment.length) lines.push(`Equipment available: ${brief.equipment.join(", ")}.`);
  if (brief.injuries.length) lines.push(`Injuries / movement limits: ${brief.injuries.join(", ")}.`);
  if (brief.conditions.length) lines.push(`Medical conditions: ${brief.conditions.join(", ")}.`);
  if (brief.loves.trim()) lines.push(`Enjoys / responds well to: ${brief.loves.trim()}.`);
  if (brief.avoids.trim()) lines.push(`Dislikes / cannot do: ${brief.avoids.trim()}.`);
  if (brief.style.trim()) lines.push(`Preferred training style: ${brief.style.trim()}.`);
  if (brief.lifestyle.trim()) lines.push(`Lifestyle: ${brief.lifestyle.trim()}.`);
  if (brief.split && brief.split !== "auto")
    lines.push(`Use this training split: ${brief.split.replace(/_/g, " ")}.`);
  lines.push(
    `${brief.progression ? "Build in" : "Do not require"} week-to-week progression.`,
  );
  const include = [
    brief.includeWarmup ? "a short warm-up" : null,
    brief.includeMobility ? "mobility work" : null,
    brief.includeConditioning ? "conditioning/cardio" : null,
  ].filter(Boolean);
  if (include.length)
    lines.push(`Where it fits, include ${include.join(", ")} as ${itemNoun.toLowerCase()}s.`);
  if (brief.notes.trim()) lines.push(`Trainer notes: ${brief.notes.trim()}.`);

  const rules = safetyRules(brief, snapshot);
  if (rules.length) lines.push(`\nSAFETY CONSTRAINTS (must follow):\n- ${rules.join("\n- ")}`);

  lines.push(`\nReturn exactly ${days} training day(s).`);
  return lines.join("\n");
}

/**
 * Draft a weekly plan for the trainer to review and edit. Returns editable plan
 * days; never writes to the database. Reads the client's snapshot server-side so
 * the plan respects their real physical condition, routes through the shared,
 * provider-agnostic AI layer, and is subject to the per-trainer daily cost cap
 * (unless the trainer supplies their own key).
 */
export async function generatePlanAction(
  input: GeneratePlanInput,
): Promise<GeneratePlanState> {
  const { supabase } = await authed(); // only signed-in trainers may call the model

  // Feature gate: AI plan generation is a paid-plan feature.
  const plan = planOf(await getSubscription());
  if (!canGenerateAi(plan)) {
    return {
      error:
        "AI plan generation is a Pro feature. Upgrade in Account → Billing to generate plans, or build one from a template.",
    };
  }

  const usingOwnKey = Boolean(input.apiKey?.trim());
  if (!usingOwnKey && !isAiConfigured()) {
    return {
      error:
        "AI plan generation isn’t configured. Add an AI key to the server environment, or start from a template.",
    };
  }

  // Cost cap: only meter calls billed to the app's own key; the tier sets the cap.
  if (!usingOwnKey) {
    const { allowed, limit } = await enforceAiDailyLimit(supabase, aiDailyLimitFor(plan));
    if (!allowed) {
      return {
        error: `You’ve reached today’s AI limit (${limit}) on the ${getTier(plan).label} plan. It resets tomorrow, or add your own AI key to continue.`,
      };
    }
  }

  const modality = getModality(input.modality ?? DEFAULT_MODALITY).key;
  const def = getModality(modality);
  const days = Math.min(7, Math.max(1, Math.round(input.brief.daysPerWeek) || 3));

  const snapshot = await getClientTrainingSnapshot(input.clientId).catch(() => null);
  const system = systemFor(modality);
  const user = buildUserPrompt(input.brief, snapshot, days, def.itemNoun);

  const res = await callAi(system, user, 4000, input.apiKey);
  if ("error" in res) return { error: res.error };

  // Strip any accidental markdown fences, then isolate the JSON object.
  const cleaned = res.text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return { error: "The AI returned an unexpected response. Please try again or use a template." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return { error: "The AI returned an unexpected response. Please try again or use a template." };
  }

  const result = draftSchema.safeParse(parsed);
  if (!result.success) {
    return { error: "The AI draft didn’t match the plan format. Please try again or use a template." };
  }

  // Stamp the chosen modality so the editor renders the right columns per day.
  const stampedDays = result.data.days.map((d) => ({ ...d, modality }));
  return { ok: true, days: stampedDays };
}
