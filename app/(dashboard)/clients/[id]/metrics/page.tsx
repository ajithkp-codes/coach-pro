import { listBodyMetrics } from "@/lib/data/bodyMetrics";
import { MetricsPanel } from "@/components/metrics/metrics-panel";

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const metrics = await listBodyMetrics(id);
  return <MetricsPanel clientId={id} metrics={metrics} />;
}
