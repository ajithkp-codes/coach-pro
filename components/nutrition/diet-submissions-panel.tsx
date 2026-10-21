"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { dayTotals, adherenceTone, mealLabel, mealOrder } from "@/lib/nutrition";
import { formatDate, formatNumber } from "@/lib/format";
import {
  acceptDietSubmissionAction,
  discardDietSubmissionAction,
} from "@/app/(dashboard)/clients/[id]/nutrition/actions";
import type { DietPlan, DietSubmission, DietSubmissionEntry, MealType } from "@/lib/types";

function groupByMeal(entries: DietSubmissionEntry[]) {
  const by = new Map<MealType, DietSubmissionEntry[]>();
  for (const e of entries) {
    const list = by.get(e.meal) ?? [];
    list.push(e);
    by.set(e.meal, list);
  }
  return Array.from(by.entries()).sort((a, b) => mealOrder(a[0]) - mealOrder(b[0]));
}

function SubmissionCard({
  clientId,
  submission,
  activePlan,
}: {
  clientId: string;
  submission: DietSubmission;
  activePlan: DietPlan | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const totals = dayTotals(submission.entries);
  const groups = groupByMeal(submission.entries);

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-bg text-primary">
            <Icon name="utensils" size={16} />
          </span>
          <span className="text-sm font-medium">{formatDate(submission.logged_on)}</span>
          <Badge tone="info">From client</Badge>
          <Badge tone={adherenceTone(totals.calories, activePlan?.target_calories)}>
            {formatNumber(Math.round(totals.calories))}
            {activePlan?.target_calories != null ? ` / ${formatNumber(activePlan.target_calories)}` : ""} kcal
          </Badge>
          <Badge tone={adherenceTone(totals.protein, activePlan?.target_protein_g)}>
            {formatNumber(Math.round(totals.protein))}
            {activePlan?.target_protein_g != null ? ` / ${formatNumber(activePlan.target_protein_g)}` : ""} g protein
          </Badge>
          {submission.water_ml != null && <Badge tone="info">{formatNumber(submission.water_ml)} ml water</Badge>}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {groups.map(([meal, items]) => (
            <div key={meal}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{mealLabel(meal)}</p>
              <ul className="mt-0.5">
                {items.map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-0.5">
                    <span>
                      {it.food}
                      {it.quantity ? <span className="text-muted-foreground"> · {it.quantity}</span> : null}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {it.calories != null ? `${formatNumber(it.calories)} kcal` : ""}
                      {it.protein_g != null ? ` · ${formatNumber(it.protein_g)} g` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {submission.notes && (
          <p className="whitespace-pre-wrap rounded-[var(--radius)] bg-muted/40 p-2 text-sm text-muted-foreground">
            {submission.notes}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button size="sm" disabled={pending} onClick={() => run(() => acceptDietSubmissionAction(clientId, submission.id))}>
            <Icon name="check" size={15} /> Accept
          </Button>
          <ButtonLink
            href={`/clients/${clientId}/nutrition/log?from_submission=${submission.id}`}
            variant="outline"
            size="sm"
          >
            Edit &amp; accept
          </ButtonLink>
          {confirmDiscard ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              className="text-danger"
              onClick={() => run(() => discardDietSubmissionAction(clientId, submission.id))}
            >
              Confirm discard
            </Button>
          ) : (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConfirmDiscard(true)}>
              Discard
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function DietSubmissionsPanel({
  clientId,
  submissions,
  activePlan,
}: {
  clientId: string;
  submissions: DietSubmission[];
  activePlan: DietPlan | null;
}) {
  if (!submissions.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon name="clock" size={16} className="text-primary" />
        <h2 className="text-sm font-semibold">
          {submissions.length} day{submissions.length === 1 ? "" : "s"} from client to review
        </h2>
      </div>
      {submissions.map((s) => (
        <SubmissionCard key={s.id} clientId={clientId} submission={s} activePlan={activePlan} />
      ))}
    </div>
  );
}
