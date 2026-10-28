import { authed } from "./session";
import { SHARE_BUCKET } from "@/lib/constants";
import type { DietPlan, DietPlanWithUrl } from "@/lib/types";
import type { DietPlanInput } from "@/lib/validation";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** List a client's diet plans (active first), each with a signed attachment URL. */
export async function listDietPlans(clientId: string): Promise<DietPlanWithUrl[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("client_id", clientId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as DietPlan[];
  const paths = rows.map((r) => r.storage_path).filter((p): p is string => !!p);
  let urlByPath = new Map<string, string | null>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(SHARE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    urlByPath = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? null]));
  }

  return rows.map((r) => ({
    ...r,
    attachment_url: r.storage_path ? (urlByPath.get(r.storage_path) ?? null) : null,
  }));
}

export async function getActiveDietPlan(clientId: string): Promise<DietPlan | null> {
  const { supabase } = await authed();
  const { data } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DietPlan) ?? null;
}

/** Make a single plan the active one for a client (deactivates the rest). */
async function clearActive(clientId: string, exceptId?: string) {
  const { supabase } = await authed();
  let q = supabase
    .from("diet_plans")
    .update({ is_active: false })
    .eq("client_id", clientId)
    .eq("is_active", true);
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

/** Defence in depth: an attachment must live under this trainer + client's folder. */
function assertPath(path: string | null, trainerId: string, clientId: string) {
  if (path && !path.startsWith(`${trainerId}/${clientId}/`)) {
    throw new Error("Invalid storage path");
  }
}

function columns(input: DietPlanInput) {
  return {
    name: input.name,
    notes: input.notes,
    is_active: input.is_active,
    target_calories: input.target_calories,
    target_protein_g: input.target_protein_g,
    days: input.days,
  };
}

function attachmentColumns(input: DietPlanInput) {
  return {
    storage_path: input.storage_path,
    original_name: input.original_name,
    content_type: input.content_type,
    size_bytes: input.size_bytes,
  };
}

export async function createDietPlan(
  clientId: string,
  input: DietPlanInput,
): Promise<DietPlan> {
  const { supabase, trainerId } = await authed();
  assertPath(input.storage_path, trainerId, clientId);
  if (input.is_active) await clearActive(clientId);
  const { data, error } = await supabase
    .from("diet_plans")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      ...columns(input),
      ...attachmentColumns(input),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DietPlan;
}

/**
 * Update a plan. The attachment is only replaced when a new one is supplied
 * (or removed when `removeAttachment` is set); the old file is deleted from
 * Storage in either case.
 */
export async function updateDietPlan(
  id: string,
  clientId: string,
  input: DietPlanInput,
  removeAttachment: boolean,
): Promise<DietPlan> {
  const { supabase, trainerId } = await authed();
  assertPath(input.storage_path, trainerId, clientId);

  const { data: existing } = await supabase
    .from("diet_plans")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const oldPath = (existing?.storage_path as string | null) ?? null;
  const replacing = !!input.storage_path || removeAttachment;

  if (input.is_active) await clearActive(clientId, id);
  const { data, error } = await supabase
    .from("diet_plans")
    .update({
      ...columns(input),
      ...(replacing ? attachmentColumns(input) : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  if (replacing && oldPath && oldPath !== input.storage_path) {
    await supabase.storage.from(SHARE_BUCKET).remove([oldPath]);
  }
  return data as DietPlan;
}

export async function setDietPlanActive(id: string, clientId: string): Promise<void> {
  const { supabase } = await authed();
  await clearActive(clientId, id);
  const { error } = await supabase
    .from("diet_plans")
    .update({ is_active: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDietPlan(id: string): Promise<void> {
  const { supabase } = await authed();
  const { data: existing } = await supabase
    .from("diet_plans")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("diet_plans").delete().eq("id", id);
  if (error) throw error;
  const path = (existing?.storage_path as string | null) ?? null;
  if (path) await supabase.storage.from(SHARE_BUCKET).remove([path]);
}
