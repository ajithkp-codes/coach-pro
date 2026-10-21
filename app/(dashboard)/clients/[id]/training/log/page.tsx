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
  searchParams: Promise<{ session?: string; plan?: string; day?: string }>;
}) {
  const { id } = await params;
  const { session: sessionId, plan: planId, day: dayIndex } = await searchParams;

  const [client, sessions, plans] = await Promise.all([
    getClient(id),
    listSessions(id),
    listPlans(id),
  ]);
  const lastByExercise = await getLastSetsByExercise(id, sessions);
  if (!client) notFound();

  const editing = sessionId ? sessions.find((s) => s.id === sessionId) : undefined;
  const action = editing
    ? updateSessionAction.bind(null, id, editing.id)
    : createSessionAction.bind(null, id);

  // Pre-populate exercises from a specific plan day (?plan=<id>&day=<index>)
  const prefillPlan = planId ? plans.find((p) => p.id === planId) : undefined;
  const prefillDay = prefillPlan && dayIndex != null ? prefillPlan.days[Number(dayIndex)] : undefined;
  const prefill = prefillDay?.items.length ? prefillDay.items : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/clients/${id}/training`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {client.full_name} · Training
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold tracking-tight">
        {editing ? "Edit workout" : prefillDay ? `Log: ${prefillDay.day}${prefillDay.title ? ` · ${prefillDay.title}` : ""}` : "Log workout"}
      </h1>

      <WorkoutLogger
        clientId={id}
        action={action}
        session={editing}
        plans={plans}
        lastByExercise={lastByExercise}
        prefill={prefill}
      />
    </div>
  );
}
