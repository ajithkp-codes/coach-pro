import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { getDietLog } from "@/lib/data/diet";
import { getActiveDietPlan } from "@/lib/data/dietPlans";
import { getDietSubmission } from "@/lib/data/dietSubmissions";
import { DietLogger } from "@/components/nutrition/diet-logger";
import {
  createDietLogAction,
  updateDietLogAction,
  createDietLogFromSubmissionAction,
} from "../actions";
import type { DietLogWithEntries } from "@/lib/types";

export const metadata = { title: "Log food · CoachPro" };

export default async function LogFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ log?: string; plan?: string; day?: string; from_submission?: string }>;
}) {
  const { id } = await params;
  const { log: logId, day: dayIndex, from_submission: submissionId } = await searchParams;

  const [client, editing, submission, activePlan] = await Promise.all([
    getClient(id),
    logId ? getDietLog(logId) : Promise.resolve(null),
    submissionId ? getDietSubmission(submissionId) : Promise.resolve(null),
    getActiveDietPlan(id),
  ]);
  if (!client) notFound();

  // A client submission prefills the logger just like editing an existing log;
  // saving creates the log (source='client') and clears the submission.
  const fromSubmission: DietLogWithEntries | null = submission
    ? {
        id: submission.id,
        trainer_id: submission.trainer_id,
        client_id: submission.client_id,
        logged_on: submission.logged_on,
        water_ml: submission.water_ml,
        notes: submission.notes,
        source: "client",
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        entries: submission.entries.map((e, i) => ({
          id: `${submission.id}-${i}`,
          trainer_id: submission.trainer_id,
          client_id: submission.client_id,
          log_id: submission.id,
          position: i,
          meal: e.meal,
          eaten_at: e.eaten_at,
          food: e.food,
          quantity: e.quantity,
          calories: e.calories,
          protein_g: e.protein_g,
          notes: e.notes,
          created_at: submission.created_at,
        })),
      }
    : null;

  const prefill = editing ?? fromSubmission;
  const action = editing
    ? updateDietLogAction.bind(null, id, editing.id)
    : submission
      ? createDietLogFromSubmissionAction.bind(null, id, submission.id)
      : createDietLogAction.bind(null, id);

  // On a fresh day, optionally prefill from a plan day (?day=<index>).
  const prefillDay = !prefill && dayIndex != null ? Number(dayIndex) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/clients/${id}/nutrition`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {client.full_name} · Nutrition
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold tracking-tight">
        {editing ? "Edit food log" : submission ? "Review client submission" : "Log food"}
      </h1>

      <DietLogger
        clientId={id}
        action={action}
        log={prefill ?? undefined}
        plan={prefill ? null : activePlan}
        prefillDay={prefillDay}
      />
    </div>
  );
}
