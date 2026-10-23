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

/**
 * For pages/layouts: redirect to /login instead of throwing.
 * Delegates to the cached `authed()` so the getUser() call is shared
 * with every other data function in the same request.
 */
export async function requireTrainer(): Promise<AuthedContext> {
  try {
    return await authed();
  } catch {
    redirect("/login");
  }
}

/**
 * Trainer profile, cached per-request so layout + page don't double-fetch.
 */
export const getTrainerProfile = cache(async (): Promise<Trainer | null> => {
  const { supabase, trainerId } = await authed();
  const { data } = await supabase
    .from("trainers")
    .select("*")
    .eq("id", trainerId)
    .maybeSingle();
  return data as Trainer | null;
});

/**
 * Ensure the signed-in trainer has a profile row. The signup trigger normally
 * creates it; this self-heals accounts where it didn't (e.g. created before the
 * trigger existed), preventing foreign-key failures when they add data.
 *
 * Uses the cached authed() to avoid an extra getUser() call.
 */
export async function ensureTrainerProfile(): Promise<void> {
  let ctx: AuthedContext;
  try {
    ctx = await authed();
  } catch {
    return;
  }
  const { supabase, trainerId, email } = ctx;

  const { data: existing } = await supabase
    .from("trainers")
    .select("id")
    .eq("id", trainerId)
    .maybeSingle();
  if (existing) return;

  const user = (await supabase.auth.getUser()).data.user;
  const fullName = (user?.user_metadata?.full_name as string) ?? null;
  const businessName = (user?.user_metadata?.business_name as string) ?? null;

  const { error } = await supabase.from("trainers").insert({
    id: trainerId,
    email,
    full_name: fullName,
    business_name: businessName,
    // Self-serve signup: accounts are active immediately. Admins can still
    // suspend by setting approved=false (see the dashboard layout gate).
    approved: true,
  });
  if (error) return; // insert raced or failed — don't send a welcome for a non-insert

  // First-time profile created: welcome the trainer and alert the admin.
  // Awaited but failure-tolerant (sendMail swallows errors) so a flaky SMTP
  // never blocks the first dashboard load. Runs exactly once per account.
  await onNewTrainer({ email, fullName, businessName });
}

/** Send the welcome email + admin signup alert for a freshly created trainer. */
async function onNewTrainer(t: {
  email: string | null;
  fullName: string | null;
  businessName: string | null;
}): Promise<void> {
  const { sendMail } = await import("@/lib/email/mailer");
  const { welcomeEmail, adminSignupAlertEmail } = await import("@/lib/email/templates");
  const jobs: Promise<unknown>[] = [];
  if (t.email) {
    jobs.push(sendMail({ to: t.email, ...welcomeEmail(t.fullName) }));
  }
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
  if (adminTo) {
    jobs.push(
      sendMail({
        to: adminTo,
        ...adminSignupAlertEmail({
          fullName: t.fullName,
          email: t.email,
          businessName: t.businessName,
        }),
      }),
    );
  }
  await Promise.allSettled(jobs);
}
