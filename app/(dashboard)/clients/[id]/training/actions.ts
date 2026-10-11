"use server";

import { revalidatePath } from "next/cache";
import { workoutSessionSchema } from "@/lib/validation";
import {
  createSession,
  updateSession,
  deleteSession,
} from "@/lib/data/training";

export interface EntryState {
  ok?: boolean;
  error?: string;
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
    notes: formData.get("notes") || undefined,
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
  revalidatePath(`/clients/${clientId}/charts`);
}

export async function createSessionAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  await createSession(clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function updateSessionAction(
  clientId: string,
  sessionId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  await updateSession(sessionId, clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function deleteSessionAction(
  clientId: string,
  sessionId: string,
): Promise<void> {
  await deleteSession(sessionId);
  revalidate(clientId);
}
