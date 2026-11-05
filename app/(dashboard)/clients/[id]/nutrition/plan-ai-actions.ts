"use server";

import { z } from "zod";
import { authed } from "@/lib/data/session";
import { dietPlanDaySchema } from "@/lib/validation";
import type { DietPlanDay } from "@/lib/types";
import { callAi, isAiConfigured } from "@/lib/ai/provider";
import { enforceAiDailyLimit } from "@/lib/data/rate-limit";
import { getEntitlement } from "@/lib/data/billing";
import { canGenerateAi, aiDailyLimitFor, getTier } from "@/lib/catalog/plans";
import {
  getClientTrainingSnapshot,
  type ClientTrainingSnapshot,
} from "@/lib/data/training-snapshot";
import {
  dayCountFor,
  DIETARY_PATTERN_OPTIONS,
  MACRO_APPROACH_OPTIONS,
  ACTIVITY_OPTIONS,
  COOKING_TIME_OPTIONS,
  BUDGET_OPTIONS,
  type DietBrief,
} from "@/lib/nutrition/diet-brief";

export interface GenerateDietState {
  ok?: boolean;
  days?: DietPlanDay[];
  targetCalories?: number | null;
  targetProtein?: number | null;
  error?: string;
}

export interface GenerateDietInput {
  clientId: string;
  brief: DietBrief;
  /** Optional per-request key; when set, the trainer pays and the cap is skipped. */
  apiKey?: string;
}

const draftSchema = z.object({
  days: z.array(dietPlanDaySchema).min(1).max(14),
  target_calories: z.number().nullish(),
  target_protein_g: z.number().nullish(),
});

const SYSTEM = [
  "You are an experienced, safety-first sports nutritionist and diet coach drafting a meal plan for one specific client.",
  "Respond with ONLY a single JSON object. No prose, no markdown code fences.",
  'Shape: {"target_calories":2000,"target_protein_g":140,"days":[{"day":"Every day","title":"","meals":[{"meal":"breakfast","time":"08:00","items":[{"food":"Oats with milk","qty":"1 cup","calories":"150","protein":"5","notes":""}]}]}]}',
  "Rules: `meal` is one of breakfast, lunch, dinner, snack, other. `day` is a short label like \"Every day\", \"Training day\", \"Rest day\" or a weekday (Mon, Tue, …).",
  "`qty`, `calories`, `protein`, `notes` are strings; `calories` and `protein` are plain numbers as strings (no units). Use `notes` for prep tips, swaps or portion cues.",
  "`target_calories` and `target_protein_g` are numbers (grams for protein). Set them to match the daily totals.",
  "Portion every item realistically and make each day's meals sum close to the calorie target.",
  "Favour common, wholesome, affordable foods the client can actually buy and cook. Include Indian staples where natural.",
  "Safety comes before everything: never include a food the client is allergic to, and shape macros and food choices to respect every stated medical condition.",
].join(" ");

const labelOf = (opts: { value: string; label: string }[], value: string) =>
  opts.find((o) => o.value === value)?.label ?? value;

/** Explicit, high-value dietary rules for the conditions the model must respect. */
function safetyRules(brief: DietBrief, snapshot: ClientTrainingSnapshot | null): string[] {
  const rules: string[] = [];
  const has = (needle: string) =>
    brief.conditions.some((c) => c.toLowerCase().includes(needle)) ||
    (snapshot?.flaggedMarkers ?? []).some((m) => m.label.toLowerCase().includes(needle));

  if (has("diabet") || has("glucose") || has("hba1c"))
    rules.push("Diabetes: favour low-glycaemic, high-fibre carbs, keep carbs consistent and spread across meals, pair carbs with protein/fat, and avoid sugary foods and refined carbs.");
  if (has("blood pressure") || has("hypertension"))
    rules.push("High blood pressure: keep sodium low, avoid pickles/papad/processed and deep-fried foods, and favour potassium-rich fruits and vegetables (DASH style).");
  if (has("thyroid"))
    rules.push("Thyroid: ensure adequate iodine, selenium and protein; keep raw goitrogens (raw cabbage, broccoli, soy) moderate and preferably cooked.");
  if (has("pcos") || has("pcod"))
    rules.push("PCOS/PCOD: lower refined carbs and sugar, favour low-GI whole foods, adequate protein and fibre, and anti-inflammatory fats.");
  if (has("cholesterol") || has("ldl") || has("triglyceride"))
    rules.push("High cholesterol: limit saturated fat and fried food, avoid trans fats, and favour soluble fibre, nuts, and omega-3 sources.");
  if (has("ibs") || has("digest"))
    rules.push("IBS/digestive issues: favour gentle, easily digested foods, moderate high-FODMAP items, and avoid very spicy or greasy meals.");
  if (has("fatty liver"))
    rules.push("Fatty liver: avoid added sugar, fried food and alcohol; favour lean protein, vegetables and whole grains.");
  if (has("pregnan") || has("postpartum"))
    rules.push("Pregnant/postpartum: avoid unpasteurised, raw or high-mercury foods; ensure adequate protein, iron, calcium and folate.");

  if (brief.allergies.length)
    rules.push(`Strictly exclude all of these allergens and anything containing them: ${brief.allergies.join(", ")}.`);
  return rules;
}

/** Translate the chosen dietary pattern into an explicit food-inclusion rule. */
function patternRule(pattern: string): string | null {
  switch (pattern) {
    case "vegetarian":
      return "Vegetarian: no meat, fish or eggs. Dairy is allowed.";
    case "eggetarian":
      return "Eggetarian: no meat or fish, but eggs and dairy are allowed.";
    case "non_vegetarian":
      return "Non-vegetarian: meat, fish and eggs are all allowed.";
    case "vegan":
      return "Vegan: no animal products at all (no meat, fish, eggs, dairy or honey).";
    case "jain":
      return "Jain: vegetarian with no root vegetables (no onion, garlic, potato, carrot, ginger).";
    default:
      return null;
  }
}

/** Build the user message: the client picture + the coach's brief + constraints. */
function buildUserPrompt(
  brief: DietBrief,
  snapshot: ClientTrainingSnapshot | null,
  days: number,
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
    if (snapshot.flaggedMarkers.length)
      lines.push(
        `Flagged health markers: ${snapshot.flaggedMarkers
          .map((m) => `${m.label} ${m.direction} (${m.value}${m.unit ? ` ${m.unit}` : ""})`)
          .join("; ")}.`,
      );
  }

  // The coach's brief.
  const focus = [brief.goalFocus.join(", "), brief.goal.trim()].filter(Boolean).join(": ");
  lines.push(`Goal: ${focus || "general healthy eating"}.`);
  if (brief.targetWeightKg.trim()) lines.push(`Target weight: ${brief.targetWeightKg.trim()} kg.`);
  if (brief.deadline) lines.push(`Target date: ${brief.deadline}.`);

  if (brief.calories.trim()) lines.push(`Daily calorie target: about ${brief.calories.trim()} kcal.`);
  else lines.push(`Estimate an appropriate daily calorie target from the client picture, activity level and goal.`);
  if (brief.protein.trim()) lines.push(`Daily protein target: about ${brief.protein.trim()} g.`);
  if (brief.macroApproach !== "auto")
    lines.push(`Macro approach: ${labelOf(MACRO_APPROACH_OPTIONS, brief.macroApproach)}.`);

  lines.push(`Meals per day: ${brief.mealsPerDay}.`);
  const pattern = patternRule(brief.dietaryPattern);
  if (pattern) lines.push(pattern);
  else lines.push(`Dietary pattern: ${labelOf(DIETARY_PATTERN_OPTIONS, brief.dietaryPattern)}.`);
  if (brief.cuisines.length && !brief.cuisines.includes("No preference"))
    lines.push(`Preferred cuisines: ${brief.cuisines.join(", ")}.`);

  lines.push(`Activity level: ${labelOf(ACTIVITY_OPTIONS, brief.activity)}.`);
  lines.push(`Cooking time: ${labelOf(COOKING_TIME_OPTIONS, brief.cookingTime)}.`);
  lines.push(`Budget: ${labelOf(BUDGET_OPTIONS, brief.budget)}.`);
  if (brief.likes.trim()) lines.push(`Foods the client loves: ${brief.likes.trim()}.`);
  if (brief.dislikes.trim()) lines.push(`Foods to avoid (preference): ${brief.dislikes.trim()}.`);

  if (brief.includeSupplements)
    lines.push("Suggest supplements only where genuinely useful, noting them in meal `notes` or the day title.");
  if (brief.includeHydration)
    lines.push("Include a daily water/hydration target in the day's `title` or first meal notes.");
  if (brief.mealPrep)
    lines.push("Favour batch-cook, meal-prep-friendly meals that keep well.");
  if (brief.notes.trim()) lines.push(`Coach notes: ${brief.notes.trim()}.`);

  const rules = safetyRules(brief, snapshot);
  if (rules.length) lines.push(`\nHARD CONSTRAINTS (must follow):\n- ${rules.join("\n- ")}`);

  if (days === 1) lines.push(`\nReturn a single representative day labelled "Every day".`);
  else if (days === 2)
    lines.push(`\nReturn exactly 2 days: one labelled "Training day" (slightly higher carbs) and one "Rest day".`);
  else lines.push(`\nReturn a full ${days}-day week labelled Mon through Sun, with sensible variety across days.`);

  return lines.join("\n");
}

/**
 * Draft a meal plan with the shared AI layer for the coach to review and edit.
 * Returns editable diet days plus suggested targets; never writes to the
 * database. Reads the client's snapshot server-side so the plan respects their
 * real physical condition and flagged markers, and is subject to the per-trainer
 * daily cost cap (unless the trainer supplies their own key).
 */
export async function generateDietPlanAction(
  input: GenerateDietInput,
): Promise<GenerateDietState> {
  const { supabase } = await authed(); // only signed-in trainers may call the model

  // Feature gate: AI plan generation is a paid-plan feature.
  const plan = (await getEntitlement()).plan;
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

  const days = dayCountFor(input.brief.dayStructure);
  const snapshot = await getClientTrainingSnapshot(input.clientId).catch(() => null);
  const user = buildUserPrompt(input.brief, snapshot, days);

  const res = await callAi(SYSTEM, user, 4000, input.apiKey);
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

  return {
    ok: true,
    days: result.data.days,
    targetCalories: result.data.target_calories ?? null,
    targetProtein: result.data.target_protein_g ?? null,
  };
}
