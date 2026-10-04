import Link from "next/link";
import {
  requireTrainer,
  getTrainerProfile,
  ensureTrainerProfile,
} from "@/lib/data/session";
import { NavLink } from "@/components/nav-link";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireTrainer();
  await ensureTrainerProfile();
  const trainer = await getTrainerProfile();
  const name = trainer?.full_name || email || "Trainer";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
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
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{name}</p>
              {trainer?.business_name && (
                <p className="text-xs text-muted-foreground">
                  {trainer.business_name}
                </p>
              )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials(name)}
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t border-border px-4 py-2 sm:hidden">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/clients">Clients</NavLink>
          <NavLink href="/account">Account</NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
