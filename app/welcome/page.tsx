import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "You're verified · CoachPro" };

/**
 * Landing screen after a user clicks the email-confirmation link. The callback
 * has already exchanged the code and signed them in, so normally there's a
 * session and we send them on to the dashboard. If the link was opened in a
 * different browser (no session here), we point them to sign in instead.
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signedIn = !!user;
  const firstName =
    ((user?.user_metadata?.full_name as string) || "").split(" ")[0] || "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
          CP
        </div>
        <span className="text-lg font-semibold tracking-tight">CoachPro</span>
      </div>

      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
          <Icon name="checkCircle" size={24} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">
          {firstName ? `You're all set, ${firstName}!` : "Your email is verified!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {signedIn
            ? "Your CoachPro account is ready and you're signed in. Head to your dashboard to add your first client and build a plan."
            : "Your email is confirmed. Sign in with your email and password to get started."}
        </p>
        <div className="mt-6">
          {signedIn ? (
            <ButtonLink href="/dashboard" className="w-full">
              Go to my dashboard <Icon name="chevronRight" size={16} />
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" className="w-full">
              Sign in to continue <Icon name="chevronRight" size={16} />
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
