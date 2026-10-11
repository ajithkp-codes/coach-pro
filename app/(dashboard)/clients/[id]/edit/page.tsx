import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { getClient } from "@/lib/data/clients";
import { updateClientAction } from "../../actions";

export const metadata = { title: "Edit client · CoachPro" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const action = updateClientAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Edit ${client.full_name}`} />
      <Card>
        <CardBody>
          <ClientForm
            action={action}
            client={client}
            submitLabel="Save changes"
            cancelHref={`/clients/${id}`}
          />
        </CardBody>
      </Card>
    </div>
  );
}
