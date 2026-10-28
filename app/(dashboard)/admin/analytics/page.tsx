import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GrowthChart } from "@/components/charts/growth-chart";
import { getOwnerAnalytics, type EngagementTier } from "@/lib/data/admin-analytics";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Analytics · CoachPro" };

const tierBadge: Record<EngagementTier, { tone: "success" | "warning" | "neutral"; label: string }> = {
  active: { tone: "success", label: "Active" },
  idle: { tone: "warning", label: "Idle" },
  dormant: { tone: "neutral", label: "Dormant" },
};

export default async function AdminAnalyticsPage() {
  const a = await getOwnerAnalytics();
  const trainerLine = a.growth.map((m) => ({ date: m.date, value: m.totalTrainers }));
  const clientLine = a.growth.map((m) => ({ date: m.date, value: m.totalClients }));
  const newThisMonth = a.growth[a.growth.length - 1];
  const distMax = Math.max(1, ...a.distribution.buckets.map((b) => b.trainers));

  return (
    <div className="flex flex-col gap-6">
      {/* Headline engagement */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="pulse"
          label="Active this week"
          value={a.engagement.active}
          accent="green"
          sub={`of ${a.totals.trainers} trainers`}
        />
        <StatTile
          icon="clock"
          label="Idle (8–30 days)"
          value={a.engagement.idle}
          accent={a.engagement.idle ? "amber" : "green"}
        />
        <StatTile
          icon="moon"
          label="Dormant (30+ days)"
          value={a.engagement.dormant}
          accent={a.engagement.dormant ? "red" : "green"}
          sub="never signed in counts here"
        />
        <StatTile
          icon="user"
          label="Active clients"
          value={a.totals.activeClients}
          accent="sky"
          sub={`avg ${a.distribution.avgClients} / trainer`}
        />
      </div>

      {/* Growth curves */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trainer growth</CardTitle>
            <Badge tone="neutral">+{newThisMonth?.newTrainers ?? 0} this month</Badge>
          </CardHeader>
          <CardBody>
            <GrowthChart data={trainerLine} label="Trainers" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client growth</CardTitle>
            <Badge tone="neutral">+{newThisMonth?.newClients ?? 0} this month</Badge>
          </CardHeader>
          <CardBody>
            <GrowthChart data={clientLine} label="Clients" />
          </CardBody>
        </Card>
      </div>

      {/* Clients-per-trainer distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Clients per trainer</CardTitle>
          <span className="text-xs text-muted-foreground">
            median {a.distribution.medianClients} · max {a.distribution.maxClients}
            {a.distribution.atFreeLimit > 0 && ` · ${a.distribution.atFreeLimit} at free cap`}
          </span>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {a.distribution.buckets.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm text-muted-foreground">{b.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(b.trainers / distMax) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
                {b.trainers}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Per-trainer activity table */}
      <Card>
        <CardHeader>
          <CardTitle>Trainer activity</CardTitle>
          <span className="text-xs text-muted-foreground">by last sign-in</span>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-border">
            {a.engagement.trainers.map((t) => {
              const badge = tierBadge[t.tier];
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {t.clientCount} client{t.clientCount === 1 ? "" : "s"}
                  </span>
                  <span className="hidden w-28 text-right text-xs text-muted-foreground sm:block">
                    {t.lastSeen ? timeAgo(t.lastSeen) : "never"}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <p className="text-xs text-muted-foreground">
        Aggregate platform metrics only — derived from signup/record timestamps and sign-in
        activity. No client health data is shown here.
      </p>
    </div>
  );
}
