import { listGoals, computeGoalProgress } from "@/lib/data/goals";
import { GoalsPanel } from "@/components/goals/goals-panel";
import type { GoalProgress } from "@/lib/data/goals";

export default async function GoalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const goals = await listGoals(id);

  const progressById: Record<string, GoalProgress> = {};
  await Promise.all(
    goals.map(async (g) => {
      progressById[g.id] = await computeGoalProgress(g);
    }),
  );

  return <GoalsPanel clientId={id} goals={goals} progressById={progressById} />;
}
