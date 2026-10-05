import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Awaiting approval · CoachPro" };

export default async function PendingPage() {
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

  if (trainer?.approved) redirect("/dashboard");

  const firstName = (trainer?.full_name || "").split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
          CP
        </div>
        <span className="text-lg font-semibold tracking-tight">CoachPro</span>
      </div>

      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-info-bg text-primary">
          <Icon name="clock" size={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">
          {firstName ? `Thanks, ${firstName}. ` : ""}Your account is awaiting approval
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We review new trainer accounts before granting access. You will be able to
          sign in and start adding clients as soon as your account is approved.
        </p>
        <form action={logoutAction} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already approved? Sign out and sign back in to refresh your access.
      </p>
    </div>
  );
}
