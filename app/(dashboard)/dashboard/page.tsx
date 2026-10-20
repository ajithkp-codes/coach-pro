import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientCard } from "@/components/clients/client-card";
import { DashboardReminders } from "@/components/reminders/dashboard-reminders";
import { DonutWidget } from "@/components/dashboard/donut-widget";
import { SessionsBarWidget } from "@/components/dashboard/sessions-bar-widget";
import { GoalRingsWidget } from "@/components/dashboard/goal-rings-widget";
import { getTrainerDashboard } from "@/lib/data/dashboard";
import { listOpenReminders } from "@/lib/data/reminders";
import { getTrainerProfile } from "@/lib/data/session";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Dashboard · CoachPro" };

export default async function DashboardPage() {
  const [data, trainer, openReminders] = await Promise.all([
    getTrainerDashboard(),
    getTrainerProfile(),
    listOpenReminders(),
  ]);
  const clientOptions = data.cards.map((c) => ({ id: c.id, full_name: c.full_name }));

  const firstName = (trainer?.full_name || "there").split(" ")[0];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const totalGoals = data.cards.reduce((sum, c) => sum + c.activeGoals, 0);
  const goalPct = totalGoals > 0
    ? Math.round((data.stats.goalsAchieved / (data.stats.goalsAchieved + totalGoals)) * 100)
    : 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-slide-up">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{today}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
            Hey, <span className="text-gradient">{firstName}</span>
          </h1>
        </div>
        <ButtonLink href="/clients/new">
          <Icon name="plus" size={16} /> Add client
        </ButtonLink>
      </div>

      {/* Visual widget row */}
      <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DonutWidget
          value={goalPct}
          label="Goal completion"
          achieved={data.stats.goalsAchieved}
          active={totalGoals}
        />
        <SessionsBarWidget
          sessionsThisWeek={data.stats.sessionsThisWeek}
        />
        <GoalRingsWidget
          activeClients={data.stats.activeClients}
          sessionsThisWeek={data.stats.sessionsThisWeek}
          goalsAchieved={data.stats.goalsAchieved}
          attentionCount={data.attention.length}
        />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your clients</h2>
            <Link href="/clients" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          {data.cards.length === 0 ? (
            <EmptyState
              title="No clients yet"
              description="Add your first client to start tracking metrics, markers, goals, training, and photos."
              action={<ButtonLink href="/clients/new">Add client</ButtonLink>}
            />
          ) : (
            <div className="stagger-children grid gap-4 sm:grid-cols-2">
              {data.cards.slice(0, 6).map((c) => (
                <ClientCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <DashboardReminders reminders={openReminders} clients={clientOptions} />

          <Card>
            <CardHeader>
              <CardTitle>Needs attention</CardTitle>
              {data.attention.length > 0 && (
                <Badge tone="warning">{data.attention.length}</Badge>
              )}
            </CardHeader>
            <CardBody>
              {data.attention.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-success">
                    <Icon name="checkCircle" size={18} />
                  </span>
                  Everything looks up to date.
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {data.attention.map((a, i) => (
                    <li key={i}>
                      <Link
                        href={`/clients/${a.clientId}`}
                        className="flex items-start gap-2.5 rounded-lg px-1 py-1 hover:bg-muted"
                      >
                        <span
                          className={
                            a.tone === "danger"
                              ? "mt-0.5 text-danger"
                              : a.tone === "warning"
                                ? "mt-0.5 text-warning"
                                : "mt-0.5 text-muted-foreground"
                          }
                        >
                          <Icon name="alert" size={16} />
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="font-medium">{a.clientName}</span>
                          <span className="block text-xs text-muted-foreground">
                            {a.label}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardBody>
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.activity.map((a, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Avatar name={a.clientName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{a.clientName}</span>
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon name={a.icon} size={12} />
                          {a.label}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(a.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
