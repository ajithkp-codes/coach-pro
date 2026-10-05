import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "../actions";

export const metadata = { title: "Add client · CoachPro" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add client"
        description="Create a record for someone you're monitoring. They don't log in. This is your workspace."
      />
      <Card>
        <CardBody>
          <ClientForm
            action={createClientAction}
            submitLabel="Create client"
            cancelHref="/clients"
          />
        </CardBody>
      </Card>
    </div>
  );
}
