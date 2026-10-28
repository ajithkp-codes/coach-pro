import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase auth redirects (email confirmation, password recovery).
 * Supports both link formats: the PKCE `code` (same-browser) and the
 * `token_hash` + `type` OTP format (works cross-device). On success it has set
 * the session cookie, so the user is signed in, then it forwards to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // We only reach here when the final auto-sign-in step failed — typically the
  // email was opened in a different browser/device than signup, so the PKCE
  // verifier cookie is missing. For a password reset that's a dead link. But
  // for an email confirmation, Supabase already verified the account before
  // redirecting here, so the user just needs to sign in — tell them that
  // instead of showing the scary "expired reset link" message.
  const isRecovery = next.startsWith("/reset-password") || type === "recovery";
  const failParam = isRecovery ? "error=link-expired" : "verified=1";
  return NextResponse.redirect(`${origin}/login?${failParam}`);
}
