import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRevenueSummary } from "@/lib/data/admin-analytics";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Revenue · CoachPro" };

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminRevenuePage() {
  const r = await getRevenueSummary();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon="trendingUp"
          label="MRR"
          value={inr(r.mrr)}
          accent="green"
          sub={`${r.proActive} × ${inr(r.pricePerPro)}/mo`}
        />
        <StatTile icon="sparkles" label="ARR (run-rate)" value={inr(r.arr)} accent="indigo" />
        <StatTile
          icon="checkCircle"
          label="Conversion"
          value={`${(r.conversion * 100).toFixed(1)}%`}
          accent="sky"
          sub="trainers on Pro"
        />
        <StatTile
          icon="alert"
          label="Needs attention"
          value={r.pastDue + r.cancelled}
          accent={r.pastDue + r.cancelled ? "amber" : "green"}
          sub={`${r.pastDue} past due · ${r.cancelled} cancelled`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming renewals</CardTitle>
          <Badge tone={r.upcomingRenewals.length ? "info" : "neutral"}>
            next 30 days · {r.upcomingRenewals.length}
          </Badge>
        </CardHeader>
        <CardBody className="p-0">
          {r.upcomingRenewals.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No active subscriptions renew in the next 30 days.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {r.upcomingRenewals.map((row) => (
                <div key={row.trainerId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={row.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Renews {formatDate(row.currentEnd)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-muted-foreground">
        MRR and ARR are run-rate estimates: active Pro subscriptions × {inr(r.pricePerPro)}/month.
        Aggregate billing metrics only.
      </p>
    </div>
  );
}
