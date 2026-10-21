import { listDietPlans } from "@/lib/data/dietPlans";
import { listDietLogs } from "@/lib/data/diet";
import { NutritionArea } from "@/components/nutrition/nutrition-area";

export default async function NutritionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [plans, logs] = await Promise.all([listDietPlans(id), listDietLogs(id)]);
  return <NutritionArea clientId={id} plans={plans} logs={logs} />;
}
