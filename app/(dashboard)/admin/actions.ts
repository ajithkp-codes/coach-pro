"use server";

import { revalidatePath } from "next/cache";
import { adminSetPlan, adminSetIsAdmin } from "@/lib/data/admin";
import type { Plan } from "@/lib/types";

export async function setPlanAction(trainerId: string, plan: Plan): Promise<void> {
  await adminSetPlan(trainerId, plan);
  revalidatePath(`/admin/trainers/${trainerId}`);
  revalidatePath("/admin");
}

export async function setAdminAction(trainerId: string, isAdmin: boolean): Promise<void> {
  await adminSetIsAdmin(trainerId, isAdmin);
  revalidatePath(`/admin/trainers/${trainerId}`);
  revalidatePath("/admin");
}
