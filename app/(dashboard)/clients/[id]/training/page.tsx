import { listSessions } from "@/lib/data/training";
import { listPlans } from "@/lib/data/plans";
import { getClientTrainingSnapshot } from "@/lib/data/training-snapshot";
import { getEntitlement } from "@/lib/data/billing";
import { canGenerateAi } from "@/lib/catalog/plans";
import { TrainingArea } from "@/components/training/training-area";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sessions, plans, snapshot, entitlement] = await Promise.all([
    listSessions(id),
    listPlans(id),
    getClientTrainingSnapshot(id),
    getEntitlement(),
  ]);
  const canUseAi = canGenerateAi(entitlement.plan);
  return (
    <TrainingArea
      clientId={id}
      plans={plans}
      sessions={sessions}
      snapshot={snapshot}
      canUseAi={canUseAi}
    />
  );
}
