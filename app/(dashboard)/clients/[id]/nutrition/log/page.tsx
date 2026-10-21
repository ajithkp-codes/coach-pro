import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { getDietLog } from "@/lib/data/diet";
import { getActiveDietPlan } from "@/lib/data/dietPlans";
import { DietLogger } from "@/components/nutrition/diet-logger";
import { createDietLogAction, updateDietLogAction } from "../actions";

export const metadata = { title: "Log food · CoachPro" };

export default async function LogFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ log?: string; plan?: string; day?: string }>;
}) {
  const { id } = await params;
  const { log: logId, day: dayIndex } = await searchParams;

  const [client, editing, activePlan] = await Promise.all([
    getClient(id),
    logId ? getDietLog(logId) : Promise.resolve(null),
    getActiveDietPlan(id),
  ]);
  if (!client) notFound();

  const action = editing
    ? updateDietLogAction.bind(null, id, editing.id)
    : createDietLogAction.bind(null, id);

  // On a fresh day, optionally prefill from a plan day (?day=<index>).
  const prefillDay = !editing && dayIndex != null ? Number(dayIndex) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/clients/${id}/nutrition`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {client.full_name} · Nutrition
      </Link>
      <h1 className="mt-2 mb-5 text-xl font-semibold tracking-tight">
        {editing ? "Edit food log" : "Log food"}
      </h1>

      <DietLogger
        clientId={id}
        action={action}
        log={editing ?? undefined}
        plan={editing ? null : activePlan}
        prefillDay={prefillDay}
      />
    </div>
  );
}
