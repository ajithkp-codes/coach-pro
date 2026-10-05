import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SHARE_BUCKET } from "@/lib/constants";
import type { SharedFile } from "@/lib/types";

export type ShareStatus = "ok" | "not_found" | "revoked" | "expired";

export interface ShareResolution {
  status: ShareStatus;
  file?: SharedFile;
  businessName?: string | null;
}

/**
 * Resolve a public share token WITHOUT authentication (the client isn't a user).
 * Uses the service role and returns only this one file's safe metadata.
 */
export async function resolveShare(token: string): Promise<ShareResolution> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shared_files")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!data) return { status: "not_found" };
  const file = data as SharedFile;
  if (file.revoked) return { status: "revoked" };
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return { status: "expired" };
  }

  const { data: trainer } = await admin
    .from("trainers")
    .select("business_name, full_name")
    .eq("id", file.trainer_id)
    .maybeSingle();

  return {
    status: "ok",
    file,
    businessName: trainer?.business_name || trainer?.full_name || null,
  };
}

/**
 * Validate the token, bump the download counter, and return a short-lived signed
 * URL that downloads with the original filename.
 */
export async function getDownloadUrl(
  token: string,
): Promise<{ url: string } | { error: ShareStatus }> {
  const resolution = await resolveShare(token);
  if (resolution.status !== "ok" || !resolution.file) {
    return { error: resolution.status };
  }
  const file = resolution.file;
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(SHARE_BUCKET)
    .createSignedUrl(file.storage_path, 60 * 60, {
      download: file.original_name,
    });
  if (error || !data?.signedUrl) return { error: "not_found" };

  await admin
    .from("shared_files")
    .update({ download_count: file.download_count + 1 })
    .eq("id", file.id);

  return { url: data.signedUrl };
}
