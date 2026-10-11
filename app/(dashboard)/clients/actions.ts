"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clientSchema } from "@/lib/validation";
import {
  createClientRecord,
  updateClientRecord,
  setClientStatus,
  deleteClientRecord,
} from "@/lib/data/clients";
import { canAddClient } from "@/lib/data/billing";

export interface FormState {
  error?: string;
}

function parseClient(formData: FormData) {
  return clientSchema.safeParse({
    full_name: formData.get("full_name"),
    sex: formData.get("sex") || "unspecified",
    date_of_birth: formData.get("date_of_birth") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
    consent_given: formData.get("consent_given"),
  });
}

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseClient(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const gate = await canAddClient();
  if (!gate.allowed) {
    return {
      error: `You've reached the Free plan limit of ${gate.limit} active clients. Upgrade to Pro (Account → Billing) for unlimited clients.`,
    };
  }
  let client;
  try {
    client = await createClientRecord(parsed.data);
  } catch (e) {
    console.error("createClient failed", e);
    return { error: "Couldn't save the client. Please try again." };
  }
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseClient(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  try {
    await updateClientRecord(clientId, parsed.data);
  } catch (e) {
    console.error("updateClient failed", e);
    return { error: "Couldn't save changes. Please try again." };
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function archiveClientAction(clientId: string, archive: boolean) {
  await setClientStatus(clientId, archive ? "archived" : "active");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function deleteClientAction(clientId: string) {
  await deleteClientRecord(clientId);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect("/clients");
}
