"use server";

import { z } from "zod";
import { authed } from "@/lib/data/session";
import { dietPlanDaySchema } from "@/lib/validation";
import type { DietPlanDay } from "@/lib/types";

export interface GenerateDietState {
  ok?: boolean;
  days?: DietPlanDay[];
  targetCalories?: number | null;
  targetProtein?: number | null;
  error?: string;
}

export interface GenerateDietInput {
  goal: string;
  calories: string;
  protein: string;
  preferences: string;
}

const draftSchema = z.object({
  days: z.array(dietPlanDaySchema).min(1).max(14),
  target_calories: z.number().nullish(),
  target_protein_g: z.number().nullish(),
});

const SYSTEM = [
  "You are an experienced sports nutritionist drafting a daily meal plan.",
  "Respond with ONLY a single JSON object — no prose, no markdown code fences.",
  'Shape: {"target_calories":2000,"target_protein_g":140,"days":[{"day":"Every day","title":"","meals":[{"meal":"breakfast","time":"08:00","items":[{"food":"Oats","qty":"1 cup","calories":"150","protein":"5","notes":""}]}]}]}',
  "Rules: `meal` is one of breakfast, lunch, dinner, snack, other. `day` is a short label like \"Every day\", \"Training day\" or a weekday.",
  "`qty`, `calories`, `protein`, `notes` are strings; `calories` and `protein` are plain numbers as strings (no units).",
  "`target_calories` and `target_protein_g` are numbers (grams for protein).",
  "Favour common, wholesome foods (include Indian staples where natural). Each day has 3–5 meals summing roughly to the calorie target.",
].join(" ");

/**
 * Draft a daily meal plan with Claude for the trainer to review and edit.
 * Returns editable diet days plus suggested targets; never writes to the
 * database. Requires an authenticated trainer and a server-side
 * ANTHROPIC_API_KEY (never exposed to the client).
 */
export async function generateDietPlanAction(
  input: GenerateDietInput,
): Promise<GenerateDietState> {
  await authed(); // defence in depth — only signed-in trainers may call Claude

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error:
        "AI plan generation isn’t configured. Add ANTHROPIC_API_KEY to the server environment, or start from a template.",
    };
  }

  const goal = input.goal.trim().slice(0, 500) || "general healthy eating";
  const cals = input.calories.trim().slice(0, 10);
  const protein = input.protein.trim().slice(0, 10);
  const prefs = input.preferences.trim().slice(0, 300);

  const prompt =
    `Draft a daily meal plan. Goal: ${goal}.` +
    (cals ? ` Target about ${cals} kcal/day.` : "") +
    (protein ? ` Aim for about ${protein} g protein/day.` : "") +
    (prefs ? ` Preferences/restrictions: ${prefs}.` : "") +
    " Return a single representative day labelled \"Every day\".";

  let text: string;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 2048,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      return { error: `The AI service returned an error (${res.status}). Please try again.` };
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    text = data.content?.find((b) => b.type === "text")?.text ?? "";
  } catch {
    return { error: "Couldn’t reach the AI service. Please try again." };
  }

  // Strip any accidental markdown fences, then isolate the JSON object.
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
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
