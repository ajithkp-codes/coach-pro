"use server";

import { revalidatePath } from "next/cache";
import { reminderSchema } from "@/lib/validation";
import {
  createReminder,
  setReminderDone,
  deleteReminder,
} from "@/lib/data/reminders";

export interface ReminderState {
  ok?: boolean;
  error?: string;
}

function revalidate(clientId?: string | null) {
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createReminderAction(
  _prev: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const parsed = reminderSchema.safeParse({
    title: formData.get("title"),
    note: formData.get("note") || undefined,
    due_on: formData.get("due_on"),
    client_id: formData.get("client_id") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reminder" };
  }
  await createReminder(parsed.data);
  revalidate(parsed.data.client_id);
  return { ok: true };
}

export async function toggleReminderAction(
  id: string,
  done: boolean,
  clientId?: string | null,
): Promise<void> {
  await setReminderDone(id, done);
  revalidate(clientId);
}

export async function deleteReminderAction(
  id: string,
  clientId?: string | null,
): Promise<void> {
  await deleteReminder(id);
  revalidate(clientId);
}
