import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { canAddClient } from "@/lib/data/billing";
import { isAiConfigured } from "@/lib/ai/provider";
import { ClientImporter } from "@/components/clients/import/client-importer";

export const metadata = { title: "Import clients · CoachPro" };

export default async function ImportClientsPage() {
  const billing = await canAddClient();
  const remaining =
    billing.limit == null ? Number.MAX_SAFE_INTEGER : Math.max(0, billing.limit - billing.count);
  // AI import/assist is optional: without a key, manual column mapping stands alone.
  const aiEnabled = isAiConfigured();

  return (
    <>
      <PageHeader
        title="Import from Excel"
        description="Upload your existing client workbook and bring everyone — with a current snapshot of their metrics, markers, and goal — into CoachPro."
        action={
          <ButtonLink href="/clients" variant="outline">
            <Icon name="chevronRight" size={16} /> Back to clients
          </ButtonLink>
        }
      />
      <ClientImporter
        remaining={remaining}
        limit={billing.limit}
        plan={billing.plan}
        aiEnabled={aiEnabled}
      />
    </>
  );
}
