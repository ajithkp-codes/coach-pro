import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { ClientTabs } from "@/components/clients/client-tabs";
import { ClientActions } from "@/components/clients/client-actions";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ageFromDob, formatDate } from "@/lib/format";
import { archiveClientAction, deleteClientAction } from "../actions";

export default async function ClientLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const isArchived = client.status === "archived";
  const age = ageFromDob(client.date_of_birth);

  return (
    <div>
      <Link
        href="/clients"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← All clients
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={client.full_name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {client.full_name}
              </h1>
              {isArchived && <Badge>Archived</Badge>}
              {!client.consent_given && (
                <Badge tone="warning">No consent on file</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[
                age !== null ? `${age} yrs` : null,
                client.phone,
                client.email,
              ]
                .filter(Boolean)
                .join(" · ") || "No contact details"}
              {client.consent_given && client.consent_at && (
                <> · Consent {formatDate(client.consent_at)}</>
              )}
            </p>
          </div>
        </div>

        <ClientActions
          clientName={client.full_name}
          editHref={`/clients/${id}/edit`}
          exportHref={`/api/v1/clients/${id}/export`}
          archiveLabel={isArchived ? "Unarchive" : "Archive"}
          archiveAction={archiveClientAction.bind(null, id, !isArchived)}
          deleteAction={deleteClientAction.bind(null, id)}
        />
      </div>

      <div className="mt-6">
        <ClientTabs clientId={id} />
      </div>

      <div className="py-6">{children}</div>
    </div>
  );
}
