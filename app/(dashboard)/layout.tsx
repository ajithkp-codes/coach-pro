import Link from "next/link";
import { redirect } from "next/navigation";
import {
  requireTrainer,
  getTrainerProfile,
  ensureTrainerProfile,
} from "@/lib/data/session";
import { getPendingCount } from "@/lib/data/admin";
import { NavLink } from "@/components/nav-link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireTrainer();
  await ensureTrainerProfile();
  const trainer = await getTrainerProfile();

  // Admin approval gate: unapproved trainers cannot use the app yet.
  if (trainer && !trainer.approved) redirect("/pending");

  const name = trainer?.full_name || email || "Trainer";
  const pendingCount = trainer?.is_admin ? await getPendingCount().catch(() => 0) : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="glass sticky top-0 z-30 border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary text-xs font-bold text-primary-foreground">
                CP
              </div>
              <span className="font-semibold tracking-tight">CoachPro</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/clients">Clients</NavLink>
              <NavLink href="/account">Account</NavLink>
              {trainer?.is_admin && (
                <NavLink href="/admin">
                  Admin
                  {pendingCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{name}</p>
              {trainer?.business_name && (
                <p className="text-xs text-muted-foreground">
                  {trainer.business_name}
                </p>
              )}
            </div>
            <ThemeToggle />
            <Avatar name={name} size="sm" />
            <form action={logoutAction} className="hidden sm:block">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>

      <BottomNav isAdmin={trainer?.is_admin} pendingCount={pendingCount} />
    </div>
  );
}
