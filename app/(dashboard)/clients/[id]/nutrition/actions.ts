"use server";

import { revalidatePath } from "next/cache";
import { dietLogSchema } from "@/lib/validation";
import { createDietLog, updateDietLog, deleteDietLog } from "@/lib/data/diet";

export interface DietLogState {
  ok?: boolean;
  error?: string;
}

function parse(formData: FormData) {
  let entries: unknown = [];
  const raw = formData.get("entries");
  if (typeof raw === "string" && raw) {
    try {
      entries = JSON.parse(raw);
    } catch {
      return { success: false as const, error: "Could not read the food entries." };
    }
  }
  const result = dietLogSchema.safeParse({
    logged_on: formData.get("logged_on"),
    water_ml: formData.get("water_ml") || undefined,
    notes: formData.get("notes") || undefined,
    entries,
  });
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.issues[0]?.message ?? "Invalid log",
    };
  }
  if (!result.data.entries.length) {
    return { success: false as const, error: "Add at least one food." };
  }
  return { success: true as const, data: result.data };
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/nutrition`);
  revalidatePath(`/clients/${clientId}`);
}

export async function createDietLogAction(
  clientId: string,
  _prev: DietLogState,
  formData: FormData,
): Promise<DietLogState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  try {
    await createDietLog(clientId, parsed.data);
  } catch (e) {
    console.error("createDietLog failed", e);
    return { error: "Couldn't save the log. Please try again." };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function updateDietLogAction(
  clientId: string,
  logId: string,
  _prev: DietLogState,
  formData: FormData,
): Promise<DietLogState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  try {
    await updateDietLog(logId, clientId, parsed.data);
  } catch (e) {
    console.error("updateDietLog failed", e);
    return { error: "Couldn't save the log. Please try again." };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function deleteDietLogAction(clientId: string, logId: string): Promise<void> {
  await deleteDietLog(logId);
  revalidate(clientId);
}
