import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ClientRoster } from "@/components/clients/client-roster";
import { getClientBoard } from "@/lib/data/dashboard";

export const metadata = { title: "Clients · CoachPro" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  // Load the whole roster (active + archived) once; the single filter bar in the
  // roster slices it client-side, so every tab's count is always accurate.
  const clients = await getClientBoard("all");

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone you're monitoring. Open a client to record metrics, markers, and goals."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/clients/import" variant="outline">
              <Icon name="file" size={16} /> Import from Excel
            </ButtonLink>
            <ButtonLink href="/clients/new">
              <Icon name="plus" size={16} /> Add client
            </ButtonLink>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client to start tracking their data."
          action={
            <div className="flex gap-2">
              <ButtonLink href="/clients/new">Add client</ButtonLink>
              <ButtonLink href="/clients/import" variant="outline">
                Import from Excel
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <ClientRoster board={clients} initialFilter={filter} />
      )}
    </>
  );
}
