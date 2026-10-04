import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getRosterSummary, listClients } from "@/lib/data/clients";
import { getTrainerProfile } from "@/lib/data/session";
import { formatDate, initials } from "@/lib/format";

export const metadata = { title: "Dashboard · CoachPro" };

export default async function DashboardPage() {
  const [summary, clients, trainer] = await Promise.all([
    getRosterSummary(),
    listClients("active"),
    getTrainerProfile(),
  ]);

  const recent = [...clients]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  const firstName = (trainer?.full_name || "there").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your private workspace — only you can see these clients and their data."
        action={<ButtonLink href="/clients/new">Add client</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active clients" value={summary.active} />
        <StatCard label="Archived" value={summary.archived} />
        <StatCard label="Total" value={summary.active + summary.archived} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Recently added
          </h2>
          <Link
            href="/clients"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all clients →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description="Add your first client to start tracking their metrics, markers, and goals."
            action={<ButtonLink href="/clients/new">Add client</ButtonLink>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="h-full transition-colors hover:border-ring">
                  <CardBody className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {initials(c.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(c.created_at)}
                      </p>
                    </div>
                    {!c.consent_given && (
                      <Badge tone="warning" className="ml-auto">
                        No consent
                      </Badge>
                    )}
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      </CardBody>
    </Card>
  );
}
