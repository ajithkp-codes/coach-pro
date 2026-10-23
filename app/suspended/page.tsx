import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Account suspended · CoachPro" };

export default async function SuspendedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainer } = await supabase
    .from("trainers")
    .select("approved, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Not suspended (or profile not yet created) → let them into the app.
  if (!trainer || trainer.approved) redirect("/dashboard");

  const firstName = (trainer.full_name || "").split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
          CP
        </div>
        <span className="text-lg font-semibold tracking-tight">CoachPro</span>
      </div>

      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
          <Icon name="alert" size={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">
          {firstName ? `${firstName}, your ` : "Your "}account is suspended
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access to CoachPro has been paused for this account. Your clients and data are safe.
          If you think this is a mistake, reach out and we&rsquo;ll sort it out.
        </p>
        <p className="mt-3 text-sm font-medium">
          <a href="mailto:ajith@coachpro.co.in" className="text-primary hover:underline">
            ajith@coachpro.co.in
          </a>
        </p>
        <form action={logoutAction} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
