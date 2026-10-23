"use server";

import { z } from "zod";
import { authed } from "@/lib/data/session";
import { planDaySchema } from "@/lib/validation";
import type { PlanDay } from "@/lib/types";
import { getModality, DEFAULT_MODALITY, type Modality } from "@/lib/catalog/modalities";
import { movementsForModality } from "@/lib/catalog/movements";

export interface GeneratePlanState {
  ok?: boolean;
  days?: PlanDay[];
  error?: string;
}

export interface GeneratePlanInput {
  goal: string;
  daysPerWeek: number;
  experience: string;
  modality?: Modality;
}

const draftSchema = z.object({ days: z.array(planDaySchema).min(1).max(14) });

/** A modality-specific system prompt: the right role, item shape and field rules,
 * plus the modality's own movement vocabulary so names match the catalog. */
function systemFor(modality: Modality): string {
  const def = getModality(modality);
  const fields = def.planColumns.map((c) => c.field);
  // Example item: exercise_name + each field this modality programs.
  const example: Record<string, string> = { exercise_name: "<movement>" };
  for (const f of fields) example[f] = "";
  const fieldList = fields.map((f) => `\`${f}\``).join(", ");
  const library = movementsForModality(modality)
    .slice(0, 48)
    .map((m) => m.name)
    .join(", ");

  return [
    `You are an experienced ${def.label} coach drafting a weekly ${def.label.toLowerCase()} plan.`,
    "Respond with ONLY a single JSON object — no prose, no markdown code fences.",
    `Shape: {"days":[{"day":"Mon","title":"${def.itemNoun} focus","items":[${JSON.stringify(example)}]}]}`,
    "Rules: `day` is a short weekday label (Mon, Tue, …). `title` is the session focus.",
    `Each item has \`exercise_name\` plus these string fields: ${fieldList}. Leave a field "" when it doesn't apply.`,
    library
      ? `Prefer these ${def.label} movements where they fit: ${library}. You may add other real, common ones.`
      : "Use common, real movement names.",
    `Produce exactly the requested number of training days (rest days omitted). Each day should have 4–7 ${def.itemNoun.toLowerCase()}s suited to the experience level and goal.`,
  ].join(" ");
}

/**
 * Draft a weekly plan with Claude for the trainer to review and edit. Returns
 * editable plan days; never writes to the database. Requires an authenticated
 * trainer and a server-side ANTHROPIC_API_KEY (never exposed to the client).
 */
export async function generatePlanAction(
  input: GeneratePlanInput,
): Promise<GeneratePlanState> {
  await authed(); // defence in depth — only signed-in trainers may call Claude

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error:
        "AI plan generation isn’t configured. Add ANTHROPIC_API_KEY to the server environment, or start from a template.",
    };
  }

  const modality = getModality(input.modality ?? DEFAULT_MODALITY).key;
  const goal = input.goal.trim().slice(0, 500) || "general fitness";
  const days = Math.min(7, Math.max(1, Math.round(input.daysPerWeek) || 3));
  const experience = input.experience.trim().slice(0, 60) || "intermediate";

  const prompt =
    `Draft a ${days}-day-per-week plan for a ${experience} trainee whose goal is: ${goal}. ` +
    `Return ${days} training days.`;

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
        system: systemFor(modality),
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

  // Stamp the chosen modality so the editor renders the right columns per day.
  const stampedDays = result.data.days.map((d) => ({ ...d, modality }));
  return { ok: true, days: stampedDays };
}
