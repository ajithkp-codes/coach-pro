"use server";

import { revalidatePath } from "next/cache";
import { goalSchema } from "@/lib/validation";
import { createGoal, updateGoal, deleteGoal } from "@/lib/data/goals";

export interface EntryState {
  ok?: boolean;
  error?: string;
}

function parse(formData: FormData) {
  return goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category") || "health",
    metric_key: formData.get("metric_key") || undefined,
    start_value: formData.get("start_value") || undefined,
    target_value: formData.get("target_value") || undefined,
    target_unit: formData.get("target_unit") || undefined,
    target_date: formData.get("target_date") || undefined,
    status: formData.get("status") || "active",
  });
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/goals`);
  revalidatePath(`/clients/${clientId}`);
}

export async function createGoalAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  }
  await createGoal(clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function updateGoalAction(
  clientId: string,
  goalId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  }
  await updateGoal(goalId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function deleteGoalAction(
  clientId: string,
  goalId: string,
): Promise<void> {
  await deleteGoal(goalId);
  revalidate(clientId);
}
