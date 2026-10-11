import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminActions } from "@/components/admin/admin-actions";
import { getTrainerDetail } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Trainer · Admin · CoachPro" };

export default async function AdminTrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getTrainerDetail(id);
  if (!detail) notFound();
  const { trainer, plan, status, currentEnd, counts } = detail;

  const countItems: [string, number][] = [
    ["Clients (active)", counts.activeClients],
    ["Clients (total)", counts.clients],
    ["Body metrics", counts.bodyMetrics],
    ["Health markers", counts.healthMarkers],
    ["Goals", counts.goals],
    ["Training sessions", counts.sessions],
    ["Progress photos", counts.photos],
    ["Shared files", counts.files],
    ["Reports", counts.reports],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/trainers" className="text-sm text-muted-foreground hover:text-foreground">
        ← All trainers
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={trainer.full_name || trainer.email || "Trainer"} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {trainer.full_name || "Unnamed trainer"}
              </h2>
              <Badge tone={plan === "pro" ? "success" : "neutral"} className="capitalize">{plan}</Badge>
              {trainer.is_admin && <Badge tone="info">Admin</Badge>}
              {!trainer.approved && <Badge tone="warning">Pending approval</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[trainer.business_name, trainer.email].filter(Boolean).join(" · ")}
            </p>
            <p className="text-xs text-muted-foreground">Joined {formatDate(trainer.created_at)}</p>
          </div>
        </div>
        <AdminActions trainerId={trainer.id} plan={plan} isAdmin={trainer.is_admin} approved={trainer.approved} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <Row label="Plan" value={<span className="capitalize">{plan}</span>} />
            <Row label="Status" value={status ? <span className="capitalize">{status}</span> : "No record"} />
            <Row label="Renews / ends" value={currentEnd ? formatDate(currentEnd) : "-"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <Row label="Email" value={trainer.email ?? "-"} />
            <Row label="Business" value={trainer.business_name ?? "-"} />
            <Row label="Platform admin" value={trainer.is_admin ? "Yes" : "No"} />
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <span className="text-xs text-muted-foreground">Counts only, no client data</span>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {countItems.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-lg font-semibold tracking-tight">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
