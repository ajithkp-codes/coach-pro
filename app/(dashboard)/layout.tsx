import { redirect } from "next/navigation";
import {
  requireTrainer,
  getTrainerProfile,
  ensureTrainerProfile,
} from "@/lib/data/session";
import { getPendingCount } from "@/lib/data/admin";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { BottomNav } from "@/components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireTrainer();
  await ensureTrainerProfile();
  const trainer = await getTrainerProfile();

  if (trainer && !trainer.approved) redirect("/pending");

  const name = trainer?.full_name || email || "Trainer";
  const pendingCount = trainer?.is_admin ? await getPendingCount().catch(() => 0) : 0;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <SidebarNav
        name={name}
        businessName={trainer?.business_name}
        isAdmin={trainer?.is_admin}
        pendingCount={pendingCount}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex min-h-screen w-full flex-col sm:pl-[220px]">
        {/* Top bar — minimal: just theme toggle + sign out on desktop */}
        <header
          className="sticky top-0 z-20 border-b border-border/30 bg-background/80 backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
            {/* Mobile: show logo */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-base font-extrabold tracking-tight">
                Coach<span className="text-gradient">Pro</span>
              </span>
            </div>
            {/* Desktop: spacer */}
            <div className="hidden sm:block" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction} className="hidden sm:block">
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav isAdmin={trainer?.is_admin} pendingCount={pendingCount} />
    </div>
  );
}
