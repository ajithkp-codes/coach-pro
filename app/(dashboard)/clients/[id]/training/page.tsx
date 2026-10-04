import { listSessions } from "@/lib/data/training";
import { TrainingPanel } from "@/components/training/training-panel";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessions = await listSessions(id);
  return <TrainingPanel clientId={id} sessions={sessions} />;
}
