import { listSessions } from "@/lib/data/training";
import { listPlans } from "@/lib/data/plans";
import { getClientTrainingSnapshot } from "@/lib/data/training-snapshot";
import { TrainingArea } from "@/components/training/training-area";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sessions, plans, snapshot] = await Promise.all([
    listSessions(id),
    listPlans(id),
    getClientTrainingSnapshot(id),
  ]);
  return <TrainingArea clientId={id} plans={plans} sessions={sessions} snapshot={snapshot} />;
}
