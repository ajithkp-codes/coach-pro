import { StatTile } from "@/components/ui/stat-tile";
import type { DashboardData } from "@/lib/data/dashboard";

export function PulseStats({
  stats,
  atRisk,
}: {
  stats: DashboardData["stats"];
  atRisk: number;
}) {
  const engagementPct =
    stats.activeClients > 0
      ? Math.round((stats.loggingThisWeek / stats.activeClients) * 100)
      : 0;

  return (
    <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        icon="users"
        label="Active clients"
        value={stats.activeClients}
        sub={stats.archived > 0 ? `${stats.archived} archived` : "Your roster"}
        accent="indigo"
      />
      <StatTile
        icon="target"
        label="Avg compliance"
        value={`${stats.avgCompliance}%`}
        sub="Prescribed vs actual, this week"
        accent={stats.avgCompliance >= 70 ? "green" : stats.avgCompliance >= 50 ? "amber" : "red"}
      />
      <StatTile
        icon="pulse"
        label="Engaged this week"
        value={`${stats.loggingThisWeek}/${stats.activeClients}`}
        sub={`${engagementPct}% logged something`}
        accent="sky"
      />
      <StatTile
        icon="alert"
        label="Needs attention"
        value={atRisk}
        sub={atRisk === 0 ? "Everyone on track" : "Clients at risk"}
        accent={atRisk === 0 ? "green" : "red"}
      />
    </div>
  );
}
