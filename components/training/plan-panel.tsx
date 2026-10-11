"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PlanEditor } from "./plan-editor";
import {
  createPlanAction,
  updatePlanAction,
  setPlanActiveAction,
  deletePlanAction,
} from "@/app/(dashboard)/clients/[id]/training/plan-actions";
import type { WorkoutPlan, PlanItem } from "@/lib/types";

function itemLine(it: PlanItem): string {
  const setsReps = [it.sets, it.reps].filter(Boolean).join(" × ");
  const parts = [setsReps, it.weight].filter(Boolean).join(" @ ");
  return parts ? `${parts}` : "";
}

function PlanView({ plan }: { plan: WorkoutPlan }) {
  const days = plan.days.filter((d) => d.items.length || d.title);
  if (!days.length) {
    return <p className="text-sm text-muted-foreground">No days added yet.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {days.map((d, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex items-baseline gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{d.day}</span>
            {d.title && <span className="text-sm font-medium">{d.title}</span>}
          </div>
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
      ))}
    </div>
  );
}

export function PlanPanel({
  clientId,
  plans,
}: {
  clientId: string;
  plans: WorkoutPlan[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Build the client&apos;s weekly plan: days, exercises, target sets, reps and weight.
        </p>
        <Modal
          wide
          title="New workout plan"
          description="Set up a weekly plan the client follows."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> New plan
            </Button>
          )}
        >
          {(close) => (
            <PlanEditor
              action={createPlanAction.bind(null, clientId)}
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
          description="Create a weekly workout plan with exercises, sets and reps."
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
                    <p className="font-medium">{plan.name}</p>
                    {plan.is_active && <Badge tone="success">Active</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!plan.is_active && (
                      <form action={setPlanActiveAction.bind(null, clientId, plan.id)}>
                        <Button type="submit" variant="ghost" size="sm">Set active</Button>
                      </form>
                    )}
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
                            <Button type="submit" variant="danger">Delete</Button>
                          </form>
                        </div>
                      )}
                    </Modal>
                  </div>
                </div>

                {plan.notes && (
                  <p className="text-sm text-muted-foreground">{plan.notes}</p>
                )}

                <PlanView plan={plan} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
