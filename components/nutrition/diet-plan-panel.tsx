"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink, DeleteButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DietPlanEditor } from "./diet-plan-editor";
import { mealLabel, planDayTotals } from "@/lib/nutrition";
import { formatBytes, formatNumber } from "@/lib/format";
import {
  createDietPlanAction,
  updateDietPlanAction,
  setDietPlanActiveAction,
  deleteDietPlanAction,
} from "@/app/(dashboard)/clients/[id]/nutrition/plan-actions";
import type { DietPlanWithUrl, DietPlanFoodItem } from "@/lib/types";

function itemLine(it: DietPlanFoodItem): string {
  const nums = [
    it.calories && `${it.calories} kcal`,
    it.protein && `${it.protein} g P`,
  ].filter(Boolean);
  return [it.qty, nums.join(" · ")].filter(Boolean).join(" · ");
}

function PlanView({ plan, clientId }: { plan: DietPlanWithUrl; clientId: string }) {
  if (!plan.days.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plan.days.map((d, di) => {
        const totals = planDayTotals(d);
        return (
          <div key={di} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{d.day}</span>
                {d.title && <span className="truncate text-sm font-medium">{d.title}</span>}
              </div>
              {d.meals.length > 0 && (
                <ButtonLink
                  href={`/clients/${clientId}/nutrition/log?plan=${plan.id}&day=${di}`}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="plus" size={13} /> Log day
                </ButtonLink>
              )}
            </div>
            {(totals.calories > 0 || totals.protein > 0) && (
              <p className="mt-1 text-xs text-muted-foreground">
                ≈ {formatNumber(totals.calories)} kcal · {formatNumber(totals.protein)} g protein
              </p>
            )}
            <div className="mt-2 flex flex-col gap-2.5">
              {d.meals.map((m, mi) => (
                <div key={mi}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {mealLabel(m.meal)}
                    {m.time && <span className="ml-1.5 font-normal normal-case tracking-normal">{m.time}</span>}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {m.items.map((it, j) => (
                      <li key={j} className="flex items-baseline justify-between gap-3">
                        <span>{it.food}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{itemLine(it)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DietPlanPanel({
  clientId,
  plans,
}: {
  clientId: string;
  plans: DietPlanWithUrl[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Build the client&apos;s meals and daily targets, or attach a plan you already wrote.
        </p>
        <Modal
          wide
          title="New diet plan"
          description="Set daily targets and meals, or attach an existing plan file."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> New plan
            </Button>
          )}
        >
          {(close) => (
            <DietPlanEditor
              clientId={clientId}
              action={createDietPlanAction.bind(null, clientId)}
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
          title="No diet plan yet"
          description="Create a meal plan with calorie and protein targets, or upload the plan you've already made."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-bg text-primary">
                      <Icon name="utensils" size={16} />
                    </span>
                    <p className="font-medium">{plan.name}</p>
                    {plan.is_active && <Badge tone="success">Active</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!plan.is_active && (
                      <form action={setDietPlanActiveAction.bind(null, clientId, plan.id)}>
                        <Button type="submit" variant="ghost" size="sm">Set active</Button>
                      </form>
                    )}
                    <Modal
                      wide
                      title="Edit diet plan"
                      trigger={(open) => (
                        <Button variant="ghost" size="sm" onClick={open}>Edit</Button>
                      )}
                    >
                      {(close) => (
                        <DietPlanEditor
                          clientId={clientId}
                          action={updateDietPlanAction.bind(null, clientId, plan.id)}
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
                      title="Delete diet plan?"
                      description={`This removes "${plan.name}"${plan.storage_path ? " and its attached file" : ""}. Food logs are kept.`}
                      trigger={(open) => (
                        <Button variant="ghost" size="sm" onClick={open}>Delete</Button>
                      )}
                    >
                      {(close) => (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={close}>Cancel</Button>
                          <form action={deleteDietPlanAction.bind(null, clientId, plan.id)}>
                            <DeleteButton />
                          </form>
                        </div>
                      )}
                    </Modal>
                  </div>
                </div>

                {(plan.target_calories != null || plan.target_protein_g != null) && (
                  <div className="flex flex-wrap gap-2">
                    {plan.target_calories != null && (
                      <Badge tone="neutral">
                        <Icon name="flame" size={12} /> {formatNumber(plan.target_calories)} kcal / day
                      </Badge>
                    )}
                    {plan.target_protein_g != null && (
                      <Badge tone="neutral">
                        <Icon name="target" size={12} /> {formatNumber(plan.target_protein_g)} g protein / day
                      </Badge>
                    )}
                  </div>
                )}

                {plan.storage_path && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <Icon name="file" size={16} className="text-muted-foreground" />
                    <span className="min-w-0 truncate font-medium">{plan.original_name ?? "Plan file"}</span>
                    {plan.size_bytes != null && (
                      <span className="text-xs text-muted-foreground">{formatBytes(plan.size_bytes)}</span>
                    )}
                    {plan.attachment_url && (
                      <a
                        href={plan.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <Icon name="download" size={14} /> Open
                      </a>
                    )}
                  </div>
                )}

                {plan.notes && (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{plan.notes}</p>
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
