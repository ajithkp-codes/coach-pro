"use server";

import { revalidatePath } from "next/cache";
import { workoutPlanSchema } from "@/lib/validation";
import {
  createPlan,
  updatePlan,
  setPlanActive,
  deletePlan,
} from "@/lib/data/plans";

export interface PlanState {
  ok?: boolean;
  error?: string;
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/training`);
  revalidatePath(`/clients/${clientId}`);
}

function parse(formData: FormData) {
  let days: unknown = [];
  const raw = formData.get("days");
  if (typeof raw === "string" && raw) {
    try {
      days = JSON.parse(raw);
    } catch {
      return { success: false as const, error: "Could not read the plan days." };
    }
  }
  const result = workoutPlanSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    is_active: formData.get("is_active"),
    days,
  });
  if (!result.success) {
    return { success: false as const, error: result.error.issues[0]?.message ?? "Invalid plan" };
  }
  return { success: true as const, data: result.data };
}

export async function createPlanAction(
  clientId: string,
  _prev: PlanState,
  formData: FormData,
): Promise<PlanState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  await createPlan(clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function updatePlanAction(
  clientId: string,
  planId: string,
  _prev: PlanState,
  formData: FormData,
): Promise<PlanState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error };
  await updatePlan(planId, clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function setPlanActiveAction(clientId: string, planId: string): Promise<void> {
  await setPlanActive(planId, clientId);
  revalidate(clientId);
}

export async function deletePlanAction(clientId: string, planId: string): Promise<void> {
  await deletePlan(planId);
  revalidate(clientId);
}
