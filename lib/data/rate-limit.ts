import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reportError } from "@/lib/observability";

/**
 * Per-trainer daily cap on paid AI calls (see migration 0019_ai_usage).
 *
 * `enforceAiDailyLimit` is called with the request-scoped (RLS) Supabase client
 * BEFORE an expensive AI call. It atomically bumps the trainer's counter via the
 * `bump_ai_usage` RPC and returns whether they're still within budget.
 *
 * Fail-open: if the migration isn't applied yet (missing function/table) the
 * call errors; we log once and ALLOW, so shipping the code ahead of the
 * migration never blocks imports — it just means the cap isn't active until the
 * migration runs. A genuine "over limit" is a clean `false` from the RPC, not an
 * error, so it is never confused with the fail-open path.
 */

/** Default daily AI-import budget per trainer; override with AI_DAILY_LIMIT_PER_TRAINER. */
const DEFAULT_DAILY_LIMIT = 50;

export function aiDailyLimit(): number {
  const raw = Number(process.env.AI_DAILY_LIMIT_PER_TRAINER);
  return Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : DEFAULT_DAILY_LIMIT;
}

export interface LimitResult {
  allowed: boolean;
  limit: number;
}

let warnedUnavailable = false;

export async function enforceAiDailyLimit(
  supabase: SupabaseClient,
  limitOverride?: number,
): Promise<LimitResult> {
  // A plan-specific cap (e.g. a higher Studio limit) wins over the env default.
  const limit =
    limitOverride != null && Number.isFinite(limitOverride) && limitOverride > 0
      ? Math.trunc(limitOverride)
      : aiDailyLimit();
  const { data, error } = await supabase.rpc("bump_ai_usage", { p_limit: limit });

  if (error) {
    // Migration not applied, or the RPC is otherwise unavailable → fail open so
    // imports keep working, but surface it once so the gap is visible.
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      reportError(error, { source: "enforceAiDailyLimit", note: "AI rate limiter unavailable — failing open (apply migration 0019)" });
    }
    return { allowed: true, limit };
  }

  return { allowed: data === true, limit };
}
