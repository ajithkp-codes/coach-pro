import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientCard } from "@/components/clients/client-card";
import { getTrainerDashboard } from "@/lib/data/dashboard";
import { getTrainerProfile } from "@/lib/data/session";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Dashboard · CoachPro" };

export default async function DashboardPage() {
  const [data, trainer] = await Promise.all([
    getTrainerDashboard(),
    getTrainerProfile(),
  ]);

  const firstName = (trainer?.full_name || "there").split(" ")[0];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            Good to see you, {firstName}
          </h1>
        </div>
        <ButtonLink href="/clients/new">
          <Icon name="plus" size={16} /> Add client
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="users"
          label="Active clients"
          value={data.stats.activeClients}
          sub={data.stats.archived > 0 ? `${data.stats.archived} archived` : "Your roster"}
        />
        <StatTile
          icon="dumbbell"
          label="Sessions this week"
          value={data.stats.sessionsThisWeek}
          accent="sky"
          sub="Across all clients"
        />
        <StatTile
          icon="checkCircle"
          label="Goals achieved"
          value={data.stats.goalsAchieved}
          accent="green"
          sub="All time"
        />
        <StatTile
          icon="alert"
          label="Needs attention"
          value={data.attention.length}
          accent={data.attention.length ? "amber" : "green"}
          sub={data.attention.length ? "See the list" : "All clear"}
        />
      </div>

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
            <div className="grid gap-4 sm:grid-cols-2">
              {data.cards.slice(0, 6).map((c) => (
                <ClientCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
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
