"use server";

import { revalidatePath } from "next/cache";
import { photoMetaSchema } from "@/lib/validation";
import { createPhotoRecord, deletePhoto } from "@/lib/data/photos";

export interface EntryState {
  ok?: boolean;
  error?: string;
}

function revalidate(clientId: string) {
  revalidatePath(`/clients/${clientId}/photos`);
  revalidatePath(`/clients/${clientId}`);
}

export async function createPhotoAction(
  clientId: string,
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const parsed = photoMetaSchema.safeParse({
    storage_path: formData.get("storage_path"),
    taken_on: formData.get("taken_on"),
    caption: formData.get("caption") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid photo" };
  }
  try {
    await createPhotoRecord(clientId, parsed.data);
  } catch (e) {
    console.error("createPhoto failed", e);
    return { error: "Couldn't save the photo. Please try again." };
  }
  revalidate(clientId);
  return { ok: true };
}

export async function deletePhotoAction(
  clientId: string,
  photoId: string,
): Promise<void> {
  await deletePhoto(photoId);
  revalidate(clientId);
}
