import { authed } from "./session";
import { PHOTO_BUCKET } from "@/lib/constants";
import type { ClientPhoto, ClientPhotoWithUrl } from "@/lib/types";
import type { PhotoMetaInput } from "@/lib/validation";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** List a client's photos (newest first) each with a short-lived signed URL. */
export async function listPhotos(
  clientId: string,
): Promise<ClientPhotoWithUrl[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("client_photos")
    .select("*")
    .eq("client_id", clientId)
    .order("taken_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as ClientPhoto[];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(
      rows.map((r) => r.storage_path),
      SIGNED_URL_TTL,
    );

  const urlByPath = new Map(
    (signed ?? []).map((s) => [s.path, s.signedUrl ?? null]),
  );

  return rows.map((r) => ({
    ...r,
    url: urlByPath.get(r.storage_path) ?? null,
  }));
}

/** Record a photo whose file was already uploaded to Storage by the browser. */
export async function createPhotoRecord(
  clientId: string,
  input: PhotoMetaInput,
): Promise<ClientPhoto> {
  const { supabase, trainerId } = await authed();

  // Defence in depth: the path must live under this trainer + client's folder.
  const expectedPrefix = `${trainerId}/${clientId}/`;
  if (!input.storage_path.startsWith(expectedPrefix)) {
    throw new Error("Invalid storage path");
  }

  const { data, error } = await supabase
    .from("client_photos")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      storage_path: input.storage_path,
      taken_on: input.taken_on,
      caption: input.caption,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ClientPhoto;
}

export async function deletePhoto(photoId: string): Promise<void> {
  const { supabase } = await authed();
  const { data: row } = await supabase
    .from("client_photos")
    .select("storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (row?.storage_path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([row.storage_path]);
  }
  const { error } = await supabase
    .from("client_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;
}
