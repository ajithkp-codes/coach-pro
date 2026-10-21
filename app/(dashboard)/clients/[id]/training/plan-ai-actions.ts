"use server";

import { z } from "zod";
import { authed } from "@/lib/data/session";
import { planDaySchema } from "@/lib/validation";
import type { PlanDay } from "@/lib/types";

export interface GeneratePlanState {
  ok?: boolean;
  days?: PlanDay[];
  error?: string;
}

export interface GeneratePlanInput {
  goal: string;
  daysPerWeek: number;
  experience: string;
}

const draftSchema = z.object({ days: z.array(planDaySchema).min(1).max(14) });

const SYSTEM = [
  "You are an experienced strength & conditioning coach drafting a weekly workout plan.",
  "Respond with ONLY a single JSON object — no prose, no markdown code fences.",
  'Shape: {"days":[{"day":"Mon","title":"Push","items":[{"exercise_name":"Bench press","sets":"4","reps":"8","weight":"","notes":""}]}]}',
  "Rules: `day` is a short weekday label (Mon, Tue, …). `title` is the session focus.",
  "`sets`, `reps`, `weight`, `notes` are strings; leave `weight` empty unless an obvious default applies.",
  "Use common, real exercise names. Produce exactly the requested number of training days (rest days omitted).",
  "Each day should have 4–7 exercises appropriate to the stated experience level and goal.",
].join(" ");

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

  return { ok: true, days: result.data.days };
}
