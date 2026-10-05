import { randomBytes } from "crypto";
import { authed } from "./session";
import { SHARE_BUCKET } from "@/lib/constants";
import type { SharedFile } from "@/lib/types";
import type { SharedFileMetaInput } from "@/lib/validation";

const EXPIRY_DAYS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  never: null,
};

export async function listSharedFiles(clientId: string): Promise<SharedFile[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("shared_files")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SharedFile[];
}

export async function createSharedFile(
  clientId: string,
  input: SharedFileMetaInput,
): Promise<SharedFile> {
  const { supabase, trainerId } = await authed();

  const expectedPrefix = `${trainerId}/${clientId}/`;
  if (!input.storage_path.startsWith(expectedPrefix)) {
    throw new Error("Invalid storage path");
  }

  const token = randomBytes(24).toString("base64url");
  const days = EXPIRY_DAYS[input.expires_in_days];
  const expires_at =
    days === null
      ? null
      : new Date(Date.now() + days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("shared_files")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      storage_path: input.storage_path,
      original_name: input.original_name,
      content_type: input.content_type,
      size_bytes: input.size_bytes,
      title: input.title,
      token,
      expires_at,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SharedFile;
}

export async function setSharedFileRevoked(
  id: string,
  revoked: boolean,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("shared_files")
    .update({ revoked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSharedFile(id: string): Promise<void> {
  const { supabase } = await authed();
  const { data: row } = await supabase
    .from("shared_files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from(SHARE_BUCKET).remove([row.storage_path]);
  }
  const { error } = await supabase.from("shared_files").delete().eq("id", id);
  if (error) throw error;
}
