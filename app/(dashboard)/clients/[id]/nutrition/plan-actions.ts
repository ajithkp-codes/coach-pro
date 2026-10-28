"use server";

import { revalidatePath } from "next/cache";
import { dietPlanSchema } from "@/lib/validation";
import {
  createDietPlan,
  updateDietPlan,
  setDietPlanActive,
  deleteDietPlan,
} from "@/lib/data/dietPlans";

export interface DietPlanState {
  ok?: boolean;
  error?: string;
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/nutrition`);
  revalidatePath(`/clients/${clientId}`);
}

function parse(formData: FormData) {
  let days: unknown = [];
  const raw = formData.get("days");
  if (typeof raw === "string" && raw) {
    try {
      days = JSON.parse(raw);
    } catch {
      return { success: false as const, error: "Could not read the plan meals." };
    }
  }
  const result = dietPlanSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    is_active: formData.get("is_active"),
    target_calories: formData.get("target_calories") || undefined,
    target_protein_g: formData.get("target_protein_g") || undefined,
    days,
    storage_path: formData.get("storage_path") || undefined,
    original_name: formData.get("original_name") || undefined,
    content_type: formData.get("content_type") || undefined,
    size_bytes: formData.get("size_bytes") || undefined,
  });
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0]?.message ?? "Invalid plan" };
  }
  return { success: true as const, data: result.data };
}

export async function createDietPlanAction(
  clientId: string,
  _prev: DietPlanState,
  formData: FormData,
): Promise<DietPlanState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  if (!parsed.data.days.length && !parsed.data.storage_path) {
    return { error: "Add at least one meal or attach a plan file." };
  }
  try {
    await createDietPlan(clientId, parsed.data);
  } catch (e) {
    console.error("createDietPlan failed", e);
    return { error: "Couldn't save the plan. Please try again." };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function updateDietPlanAction(
  clientId: string,
  planId: string,
  _prev: DietPlanState,
  formData: FormData,
): Promise<DietPlanState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  const removeAttachment = formData.get("remove_attachment") === "true";
  try {
    await updateDietPlan(planId, clientId, parsed.data, removeAttachment);
  } catch (e) {
    console.error("updateDietPlan failed", e);
    return { error: "Couldn't save the plan. Please try again." };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function setDietPlanActiveAction(clientId: string, planId: string): Promise<void> {
  await setDietPlanActive(planId, clientId);
  revalidate(clientId);
}

export async function deleteDietPlanAction(clientId: string, planId: string): Promise<void> {
  await deleteDietPlan(planId);
  revalidate(clientId);
}
