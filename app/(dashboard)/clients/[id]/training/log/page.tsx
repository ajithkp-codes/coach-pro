import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { listSessions, getLastSetsByExercise } from "@/lib/data/training";
import { listPlans } from "@/lib/data/plans";
import { WorkoutLogger } from "@/components/training/workout-logger";
import {
  createSessionAction,
  updateSessionAction,
} from "../actions";

export const metadata = { title: "Log workout · CoachPro" };

export default async function LogWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await params;
  const { session: sessionId } = await searchParams;

  const [client, sessions, plans, lastByExercise] = await Promise.all([
    getClient(id),
    listSessions(id),
    listPlans(id),
    getLastSetsByExercise(id),
  ]);
  if (!client) notFound();

  const editing = sessionId ? sessions.find((s) => s.id === sessionId) : undefined;
  const action = editing
    ? updateSessionAction.bind(null, id, editing.id)
    : createSessionAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/clients/${id}/training`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {client.full_name} · Training
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold tracking-tight">
        {editing ? "Edit workout" : "Log workout"}
      </h1>

      <WorkoutLogger
        clientId={id}
        action={action}
        session={editing}
        plans={plans}
        lastByExercise={lastByExercise}
      />
    </div>
  );
}
