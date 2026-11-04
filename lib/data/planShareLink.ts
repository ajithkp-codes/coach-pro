import "server-only";
import { randomBytes } from "crypto";
import { authed } from "./session";

/**
 * Trainer-side management of a workout plan's public share link. The link itself
 * is served unauthenticated (lib/data/plan-public.ts); these writes go through
 * the RLS client, so a trainer can only touch their own plans.
 */

/**
 * Turn sharing on for a plan: mint a token on first use (reused afterwards so an
 * already-shared link stays stable) and clear any revoke. Returns the token.
 */
export async function enablePlanShare(planId: string): Promise<string> {
  const { supabase } = await authed();

  const { data: existing, error: readErr } = await supabase
    .from("workout_plans")
    .select("share_token")
    .eq("id", planId)
    .single();
  if (readErr) throw readErr;

  const token = (existing?.share_token as string | null) ?? randomBytes(18).toString("base64url");

  const { error } = await supabase
    .from("workout_plans")
    .update({ share_token: token, share_revoked: false })
    .eq("id", planId);
  if (error) throw error;

  return token;
}

/** Flip a plan's share link on or off without discarding its token. */
export async function setPlanShareRevoked(planId: string, revoked: boolean): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("workout_plans")
    .update({ share_revoked: revoked })
    .eq("id", planId);
  if (error) throw error;
}
