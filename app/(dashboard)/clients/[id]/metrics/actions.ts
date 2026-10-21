"use server";

import { revalidatePath } from "next/cache";
import { bodyMetricSchema } from "@/lib/validation";
import {
  createBodyMetric,
  updateBodyMetric,
  deleteBodyMetric,
} from "@/lib/data/bodyMetrics";
import { BODY_METRIC_KEYS } from "@/lib/catalog/metrics";

export interface EntryState {
  ok?: boolean;
  error?: string;
}

function parse(formData: FormData) {
  const raw: Record<string, unknown> = {
    measured_on: formData.get("measured_on"),
    notes: formData.get("notes") || undefined,
  };
  for (const k of BODY_METRIC_KEYS) raw[k] = formData.get(k) || undefined;
  return bodyMetricSchema.safeParse(raw);
}

export async function createBodyMetricAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  await createBodyMetric(clientId, parsed.data);
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function updateBodyMetricAction(
  clientId: string,
  metricId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  await updateBodyMetric(metricId, parsed.data);
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

export async function deleteBodyMetricAction(
  clientId: string,
  metricId: string,
): Promise<void> {
  await deleteBodyMetric(metricId);
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}`);
}
