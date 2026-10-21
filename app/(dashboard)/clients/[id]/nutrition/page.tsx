import { listDietPlans } from "@/lib/data/dietPlans";
import { listDietLogs } from "@/lib/data/diet";
import { listDietSubmissions } from "@/lib/data/dietSubmissions";
import { getClientLogToken } from "@/lib/data/clientLogLink";
import { NutritionArea } from "@/components/nutrition/nutrition-area";

export default async function NutritionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plans, logs, submissions, logToken] = await Promise.all([
    listDietPlans(id),
    listDietLogs(id),
    listDietSubmissions(id),
    getClientLogToken(id),
  ]);
  return (
    <NutritionArea
      clientId={id}
      plans={plans}
      logs={logs}
      submissions={submissions}
      logToken={logToken}
    />
  );
}
