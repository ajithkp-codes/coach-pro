"use server";

import { revalidatePath } from "next/cache";
import { healthMarkerSchema } from "@/lib/validation";
import {
  createHealthMarker,
  updateHealthMarker,
  deleteHealthMarker,
} from "@/lib/data/healthMarkers";

export interface EntryState {
  ok?: boolean;
  error?: string;
}

function parse(formData: FormData) {
  return healthMarkerSchema.safeParse({
    measured_on: formData.get("measured_on"),
    marker_key: formData.get("marker_key"),
    custom_name: formData.get("custom_name") || undefined,
    value: formData.get("value"),
    unit: formData.get("unit") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}`);
}

export async function createHealthMarkerAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  await createHealthMarker(clientId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function updateHealthMarkerAction(
  clientId: string,
  markerId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  await updateHealthMarker(markerId, parsed.data);
  revalidate(clientId);
  return { ok: true };
}

export async function deleteHealthMarkerAction(
  clientId: string,
  markerId: string,
): Promise<void> {
  await deleteHealthMarker(markerId);
  revalidate(clientId);
}
