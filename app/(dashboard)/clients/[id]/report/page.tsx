import { listReports } from "@/lib/data/reports";
import { ReportsPanel } from "@/components/report/reports-panel";

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reports = await listReports(id);
  return <ReportsPanel clientId={id} reports={reports} />;
}
