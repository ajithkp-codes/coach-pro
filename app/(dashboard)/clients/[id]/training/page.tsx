import { listSessions } from "@/lib/data/training";
import { listPlans } from "@/lib/data/plans";
import { getClientTrainingSnapshot } from "@/lib/data/training-snapshot";
import { getSubscription, planOf } from "@/lib/data/billing";
import { canGenerateAi } from "@/lib/catalog/plans";
import { TrainingArea } from "@/components/training/training-area";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sessions, plans, snapshot, sub] = await Promise.all([
    listSessions(id),
    listPlans(id),
    getClientTrainingSnapshot(id),
    getSubscription(),
  ]);
  const canUseAi = canGenerateAi(planOf(sub));
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
