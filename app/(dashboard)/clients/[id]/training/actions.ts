"use server";

import { revalidatePath } from "next/cache";
import { workoutSessionSchema } from "@/lib/validation";
import { getModality } from "@/lib/catalog/modalities";
import {
  createSession,
  updateSession,
  deleteSession,
  getExerciseBests,
  detectPRs,
  type PR,
  type PRSetInput,
} from "@/lib/data/training";

export interface EntryState {
  ok?: boolean;
  error?: string;
  prs?: PR[];
}

function parse(formData: FormData) {
  let sets: unknown = [];
  const raw = formData.get("sets");
  if (typeof raw === "string" && raw) {
    try {
      sets = JSON.parse(raw);
    } catch {
      return { success: false as const, error: "Could not read the sets." };
    }
  }
  const result = workoutSessionSchema.safeParse({
    performed_on: formData.get("performed_on"),
    title: formData.get("title") || undefined,
    duration_min: formData.get("duration_min") || undefined,
    modality: formData.get("modality") || undefined,
    notes: formData.get("notes") || undefined,
    plan_id: formData.get("plan_id") || undefined,
    plan_day: formData.get("plan_day") || undefined,
    week_number: formData.get("week_number") || undefined,
    sets,
  });
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.issues[0]?.message ?? "Invalid session",
    };
  }
  return { success: true as const, data: result.data };
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/training`);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/progress`);
}

export async function createSessionAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  const bests = await getExerciseBests(clientId);
  await createSession(clientId, parsed.data);
  const prs = detectPRs(prSets(parsed.data.sets), bests, getModality(parsed.data.modality).primaryMetric);
  revalidate(clientId);
  return { ok: true, prs };
}

/** Reduce validated sets to the fields PR detection reads. */
function prSets(sets: ReturnType<typeof workoutSessionSchema.parse>["sets"]): PRSetInput[] {
  return sets.map((s) => ({
    exercise_name: s.exercise_name,
    reps: s.reps,
    weight_kg: s.weight_kg,
    duration_sec: s.duration_sec,
    distance_m: s.distance_m,
  }));
}

export async function updateSessionAction(
  clientId: string,
  sessionId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  const bests = await getExerciseBests(clientId, sessionId);
  await updateSession(sessionId, clientId, parsed.data);
  const prs = detectPRs(prSets(parsed.data.sets), bests, getModality(parsed.data.modality).primaryMetric);
  revalidate(clientId);
  return { ok: true, prs };
}

export async function deleteSessionAction(
  clientId: string,
  sessionId: string,
): Promise<void> {
  await deleteSession(sessionId);
  revalidate(clientId);
}
