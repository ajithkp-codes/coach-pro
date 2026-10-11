import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trainer } from "@/lib/types";

export interface AuthedContext {
  supabase: SupabaseClient;
  trainerId: string;
  email: string | null;
}

/**
 * Resolve the signed-in trainer for server code. Throws if unauthenticated
 * (routes are already guarded by middleware; this is defence in depth).
 *
 * Wrapped in React `cache` so repeated calls within one request share a single
 * client + `getUser()` validation instead of hitting the auth server each time.
 */
export const authed = cache(async (): Promise<AuthedContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return { supabase, trainerId: user.id, email: user.email ?? null };
});

/** For pages/layouts: redirect to /login instead of throwing. */
export async function requireTrainer(): Promise<AuthedContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, trainerId: user.id, email: user.email ?? null };
}

export async function getTrainerProfile(): Promise<Trainer | null> {
  const { supabase, trainerId } = await authed();
  const { data } = await supabase
    .from("trainers")
    .select("*")
    .eq("id", trainerId)
    .maybeSingle();
  return data as Trainer | null;
}

/**
 * Ensure the signed-in trainer has a profile row. The signup trigger normally
 * creates it; this self-heals accounts where it didn't (e.g. created before the
 * trigger existed), preventing foreign-key failures when they add data.
 * Requires the trainers_insert RLS policy (migration 0003).
 */
export async function ensureTrainerProfile(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("trainers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  await supabase.from("trainers").insert({
    id: user.id,
    email: user.email,
    full_name: (user.user_metadata?.full_name as string) ?? null,
    business_name: (user.user_metadata?.business_name as string) ?? null,
  });
}
