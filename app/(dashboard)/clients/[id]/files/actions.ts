"use server";

import { revalidatePath } from "next/cache";
import { sharedFileMetaSchema } from "@/lib/validation";
import {
  createSharedFile,
  setSharedFileRevoked,
  deleteSharedFile,
} from "@/lib/data/sharedFiles";
import type { SharedFile } from "@/lib/types";

export interface ShareState {
  ok?: boolean;
  error?: string;
  created?: Pick<SharedFile, "token">;
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/share`);
}

export async function createSharedFileAction(
  clientId: string,
  _prev: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const parsed = sharedFileMetaSchema.safeParse({
    storage_path: formData.get("storage_path"),
    original_name: formData.get("original_name"),
    content_type: formData.get("content_type") || undefined,
    size_bytes: formData.get("size_bytes") || undefined,
    title: formData.get("title") || undefined,
    expires_in_days: formData.get("expires_in_days") || "30",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid file" };
  }
  try {
    const file = await createSharedFile(clientId, parsed.data);
    revalidate(clientId);
    return { ok: true, created: { token: file.token } };
  } catch (e) {
    console.error("createSharedFile failed", e);
    return { error: "Couldn't create the share. Please try again." };
  }
}

export async function setRevokedAction(
  clientId: string,
  id: string,
  revoked: boolean,
): Promise<void> {
  await setSharedFileRevoked(id, revoked);
  revalidate(clientId);
}

export async function deleteSharedFileAction(
  clientId: string,
  id: string,
): Promise<void> {
  await deleteSharedFile(id);
  revalidate(clientId);
}
