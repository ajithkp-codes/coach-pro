"use client";

import { Button, ButtonLink, DeleteButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/format";
import { adherenceTone, dayTotals, mealLabel, mealOrder } from "@/lib/nutrition";
import { deleteDietLogAction } from "@/app/(dashboard)/clients/[id]/nutrition/actions";
import type { DietLogWithEntries, DietLogEntry, DietPlanWithUrl } from "@/lib/types";

function TargetBadge({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
}) {
  if (target == null || target <= 0) {
    return (
      <Badge tone="neutral">
        {label} {formatNumber(Math.round(value))} {unit}
      </Badge>
    );
  }
  return (
    <Badge tone={adherenceTone(value, target)}>
      {label} {formatNumber(Math.round(value))} / {formatNumber(target)} {unit}
    </Badge>
  );
}

function groupByMeal(entries: DietLogEntry[]): { meal: DietLogEntry["meal"]; entries: DietLogEntry[] }[] {
  const byMeal = new Map<DietLogEntry["meal"], DietLogEntry[]>();
  for (const e of entries) {
    const list = byMeal.get(e.meal) ?? [];
    list.push(e);
    byMeal.set(e.meal, list);
  }
  return [...byMeal.entries()]
    .map(([meal, list]) => ({ meal, entries: list }))
    .sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal));
}

export function DietLogPanel({
  clientId,
  logs,
  activePlan,
}: {
  clientId: string;
  logs: DietLogWithEntries[];
  activePlan: DietPlanWithUrl | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} day{logs.length === 1 ? "" : "s"} logged
          {activePlan && <> · targets from <span className="font-medium">{activePlan.name}</span></>}
        </p>
        <ButtonLink href={`/clients/${clientId}/nutrition/log`}>
          <Icon name="plus" size={16} /> Log a day
        </ButtonLink>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          title="No food logged yet"
          description="Record what the client ate on a day — foods, calories and protein — to track adherence."
          action={
            <ButtonLink href={`/clients/${clientId}/nutrition/log`}>Log a day</ButtonLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => {
            const totals = dayTotals(log.entries);
            const groups = groupByMeal(log.entries);
            return (
              <Card key={log.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatDate(log.logged_on)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {log.entries.length} item{log.entries.length === 1 ? "" : "s"}
                        {log.water_ml != null && <> · {formatNumber(log.water_ml)} ml water</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ButtonLink
                        href={`/clients/${clientId}/nutrition/log?log=${log.id}`}
                        variant="ghost"
                        size="sm"
                      >
                        Edit
                      </ButtonLink>
                      <Modal
                        title="Delete this day's log?"
                        description={`This removes the food logged on ${formatDate(log.logged_on)}.`}
                        trigger={(open) => (
                          <Button variant="ghost" size="sm" onClick={open}>Delete</Button>
                        )}
                      >
                        {(close) => (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={close}>Cancel</Button>
                            <form action={deleteDietLogAction.bind(null, clientId, log.id)}>
                              <DeleteButton />
                            </form>
                          </div>
                        )}
                      </Modal>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <TargetBadge label="" value={totals.calories} target={activePlan?.target_calories ?? null} unit="kcal" />
                    <TargetBadge label="" value={totals.protein} target={activePlan?.target_protein_g ?? null} unit="g protein" />
                  </div>

                  <div className="flex flex-col gap-2.5 border-t border-border pt-3">
                    {groups.map((g) => (
                      <div key={g.meal}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {mealLabel(g.meal)}
                        </p>
                        <ul className="mt-1 flex flex-col gap-1 text-sm">
                          {g.entries.map((e) => (
                            <li key={e.id} className="flex items-baseline justify-between gap-3">
                              <span>
                                {e.food}
                                {e.quantity && <span className="text-muted-foreground"> · {e.quantity}</span>}
                                {e.eaten_at && <span className="text-xs text-muted-foreground"> · {e.eaten_at}</span>}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {[
                                  e.calories != null && `${formatNumber(e.calories)} kcal`,
                                  e.protein_g != null && `${formatNumber(e.protein_g)} g`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {log.notes && (
                    <p className="whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
                      {log.notes}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
