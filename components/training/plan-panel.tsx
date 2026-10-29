"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink, DeleteButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanEditor } from "./plan-editor";
import { PlanShare } from "./plan-share";
import { daySummary } from "@/lib/training-analytics";
import { describeCadence } from "@/lib/catalog/plan-cadence";
import {
  createPlanAction,
  updatePlanAction,
  setPlanActiveAction,
  deletePlanAction,
} from "@/app/(dashboard)/clients/[id]/training/plan-actions";
import type { WorkoutPlan, PlanItem } from "@/lib/types";
import type { ClientTrainingSnapshot } from "@/lib/data/training-snapshot";

function itemLine(it: PlanItem): string {
  const setsReps = [it.sets, it.reps].filter(Boolean).join(" × ");
  const parts = [setsReps, it.weight].filter(Boolean).join(" @ ");
  return parts ? `${parts}` : "";
}

function PlanView({ plan, clientId }: { plan: WorkoutPlan; clientId: string }) {
  const days = plan.days.filter((d) => d.items.length || d.title);
  if (!days.length) {
    return <p className="text-sm text-muted-foreground">No days added yet.</p>;
  }
  // Find the real index in plan.days (not in the filtered list) so prefill URL is correct.
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {days.map((d) => {
        const realIdx = plan.days.indexOf(d);
        const summary = daySummary(d);
        return (
          <div key={realIdx} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{d.day}</span>
                {d.title && <span className="text-sm font-medium">{d.title}</span>}
              </div>
              {d.items.length > 0 && (
                <ButtonLink
                  href={`/clients/${clientId}/training/log?plan=${plan.id}&day=${realIdx}`}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="play" size={13} /> Log
                </ButtonLink>
              )}
            </div>
            {d.items.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                {[
                  summary.focus.length ? summary.focus.join(" · ") : null,
                  `${summary.exercises} exercise${summary.exercises === 1 ? "" : "s"}`,
                  `~${summary.minutes} min`,
                ]
                  .filter(Boolean)
                  .map((chip, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-border">·</span>}
                      {chip}
                    </span>
                  ))}
              </div>
            )}
            {d.items.length ? (
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {d.items.map((it, j) => (
                  <li key={j} className="flex items-baseline justify-between gap-3">
                    <span>{it.exercise_name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{itemLine(it)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Rest / no exercises</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PlanPanel({
  clientId,
  plans,
  snapshot,
  canUseAi = false,
}: {
  clientId: string;
  plans: WorkoutPlan[];
  snapshot?: ClientTrainingSnapshot | null;
  canUseAi?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Build the client&apos;s training plan: days, exercises, target sets, reps and weight — set to run weekly, monthly or any length you choose.
        </p>
        <Modal
          wide
          title="New workout plan"
          description="Set up a training plan the client follows."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> New plan
            </Button>
          )}
        >
          {(close) => (
            <PlanEditor
              action={createPlanAction.bind(null, clientId)}
              clientId={clientId}
              snapshot={snapshot}
              canUseAi={canUseAi}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No plan yet"
          description="Create a training plan with exercises, sets and reps."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-bg text-primary">
                      <Icon name="dumbbell" size={16} />
                    </span>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {describeCadence(plan.cadence ?? "weekly", plan.duration_weeks ?? 1)}
                        {plan.starts_on ? ` · from ${plan.starts_on}` : ""}
                      </p>
                    </div>
                    {plan.is_active && <Badge tone="success">Active</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!plan.is_active && (
                      <form action={setPlanActiveAction.bind(null, clientId, plan.id)}>
                        <Button type="submit" variant="ghost" size="sm">Set active</Button>
                      </form>
                    )}
                    <Modal
                      title="Share plan"
                      description="Send your client a read-only link to this plan."
                      trigger={(open) => (
                        <Button variant="ghost" size="sm" onClick={open}>
                          <Icon name="link" size={14} /> Share
                        </Button>
                      )}
                    >
                      {() => <PlanShare clientId={clientId} plan={plan} />}
                    </Modal>
                    <Modal
                      wide
                      title="Edit plan"
                      trigger={(open) => (
                        <Button variant="ghost" size="sm" onClick={open}>Edit</Button>
                      )}
                    >
                      {(close) => (
                        <PlanEditor
                          action={updatePlanAction.bind(null, clientId, plan.id)}
                          plan={plan}
                          onCancel={close}
                          onSuccess={() => {
                            close();
                            router.refresh();
                          }}
                        />
                      )}
                    </Modal>
                    <Modal
                      title="Delete plan?"
                      description={`This removes "${plan.name}".`}
                      trigger={(open) => (
                        <Button variant="ghost" size="sm" onClick={open}>Delete</Button>
                      )}
                    >
                      {(close) => (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={close}>Cancel</Button>
                          <form action={deletePlanAction.bind(null, clientId, plan.id)}>
                            <DeleteButton />
                          </form>
                        </div>
                      )}
                    </Modal>
                  </div>
                </div>

                {plan.notes && (
                  <p className="text-sm text-muted-foreground">{plan.notes}</p>
                )}

                <PlanView plan={plan} clientId={clientId} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
