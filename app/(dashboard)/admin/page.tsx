import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlatformStats, listTrainers } from "@/lib/data/admin";
import { setApprovedAction } from "@/app/(dashboard)/admin/actions";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Admin · CoachPro" };

export default async function AdminOverviewPage() {
  const [stats, trainers] = await Promise.all([getPlatformStats(), listTrainers()]);
  const pending = trainers.filter((t) => !t.approved);
  const recent = trainers.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon="users" label="Trainers" value={stats.trainers} sub={`${stats.admins} admin${stats.admins === 1 ? "" : "s"}`} />
        <StatTile icon="user" label="Active clients" value={stats.activeClients} accent="sky" sub={`${stats.clients} total`} />
        <StatTile icon="checkCircle" label="Pro subscriptions" value={stats.proActive} accent="green" />
        <StatTile
          icon="alert"
          label="Pending approvals"
          value={stats.pending}
          accent={stats.pending ? "amber" : "green"}
          sub={stats.pending ? "Action needed" : "All clear"}
        />
      </div>

      {pending.length > 0 && (
        <Card className="border-warning/40">
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <Badge tone="warning">{pending.length}</Badge>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-border">
              {pending.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.full_name || t.email || "Trainer"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.full_name || "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    Signed up {formatDate(t.created_at)}
                  </span>
                  <Link href={`/admin/trainers/${t.id}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    View
                  </Link>
                  <form action={setApprovedAction.bind(null, t.id, true)}>
                    <Button type="submit" size="sm">Approve</Button>
                  </form>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent trainers</CardTitle>
          <Link href="/admin/trainers" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/admin/trainers/${t.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <Avatar name={t.full_name || t.email || "Trainer"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.full_name || "Unnamed"}
                    {t.is_admin && <span className="ml-2 text-xs font-normal text-primary">admin</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{t.email}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {t.clientCount} client{t.clientCount === 1 ? "" : "s"}
                </span>
                <Badge tone={t.plan === "pro" ? "success" : "neutral"} className="capitalize">
                  {t.plan}
                </Badge>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(t.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
