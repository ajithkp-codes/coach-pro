import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listClients } from "@/lib/data/clients";
import { formatDate, ageFromDob, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/lib/types";

export const metadata = { title: "Clients · CoachPro" };

const TABS: { key: ClientStatus | "all"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = (TABS.find((t) => t.key === status)?.key ?? "active") as
    | ClientStatus
    | "all";
  const clients = await listClients(current);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone you're monitoring. Open a client to record metrics, markers, and goals."
        action={<ButtonLink href="/clients/new">Add client</ButtonLink>}
      />

      <div className="mb-4 flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "active" ? "/clients" : `/clients?status=${t.key}`}
            className={cn(
              "rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-colors",
              current === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title={current === "archived" ? "No archived clients" : "No clients yet"}
          description={
            current === "archived"
              ? "Clients you archive will appear here."
              : "Add your first client to start tracking their data."
          }
          action={
            current !== "archived" && (
              <ButtonLink href="/clients/new">Add client</ButtonLink>
            )
          }
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {clients.map((c) => {
            const age = ageFromDob(c.date_of_birth);
            return (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initials(c.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      age !== null ? `${age} yrs` : null,
                      c.phone,
                      c.email,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  Added {formatDate(c.created_at)}
                </div>
                {c.status === "archived" && <Badge>Archived</Badge>}
                {!c.consent_given && c.status === "active" && (
                  <Badge tone="warning">No consent</Badge>
                )}
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}
