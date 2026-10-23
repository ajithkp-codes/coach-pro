"use server";

import { revalidatePath } from "next/cache";
import { appointmentSchema } from "@/lib/validation";
import {
  createAppointment,
  updateAppointment,
  setAppointmentStatus,
  deleteAppointment,
  markMissed,
  clearMissed,
} from "@/lib/data/appointments";
import type { AppointmentStatus } from "@/lib/types";

export interface AppointmentState {
  ok?: boolean;
  error?: string;
}

function revalidate(clientId?: string | null) {
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

function parse(formData: FormData) {
  return appointmentSchema.safeParse({
    client_id: formData.get("client_id") || undefined,
    starts_at: formData.get("starts_at"),
    duration_min: formData.get("duration_min") || undefined,
    title: formData.get("title") || undefined,
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || undefined,
  });
}

export async function createAppointmentAction(
  _prev: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid appointment" };
  }
  await createAppointment(parsed.data);
  revalidate(parsed.data.client_id);
  return { ok: true };
}

export async function updateAppointmentAction(
  id: string,
  _prev: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid appointment" };
  }
  await updateAppointment(id, parsed.data);
  revalidate(parsed.data.client_id);
  return { ok: true };
}

export async function setAppointmentStatusAction(
  id: string,
  status: AppointmentStatus,
  clientId?: string | null,
): Promise<void> {
  await setAppointmentStatus(id, status);
  revalidate(clientId);
}

export async function deleteAppointmentAction(
  id: string,
  clientId?: string | null,
): Promise<void> {
  await deleteAppointment(id);
  revalidate(clientId);
}

/**
 * Mark a plan session missed for a client on a local day. Records an attendance
 * no_show that drops the client's adherence and feeds the at-risk score — the
 * trainer's "he didn't show up" without re-entering the plan.
 */
export async function markMissedAction(
  clientId: string,
  dateISO: string,
  title?: string | null,
): Promise<void> {
  await markMissed(clientId, dateISO, title ?? null);
  revalidate(clientId);
}

/** Undo a missed mark for a client on a local day. */
export async function clearMissedAction(
  clientId: string,
  dateISO: string,
): Promise<void> {
  await clearMissed(clientId, dateISO);
  revalidate(clientId);
}
