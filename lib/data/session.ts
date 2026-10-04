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
