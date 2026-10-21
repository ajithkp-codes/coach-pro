"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { todayISO } from "@/lib/format";
import { createReminderAction, type ReminderState } from "@/app/(dashboard)/reminders/actions";
import type { NutritionNudge } from "@/lib/nutrition";

const toneClass: Record<NutritionNudge["tone"], string> = {
  warning: "border-warning/30 bg-warning-bg/50 text-warning",
  info: "border-border bg-muted/40 text-primary",
};

function AddButton({ added }: { added: boolean }) {
  const { pending } = useFormStatus();
  if (added) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <Icon name="check" size={14} /> Reminder added
      </span>
    );
  }
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Icon name="plus" size={14} /> {pending ? "Adding…" : "Add reminder"}
    </Button>
  );
}

function NudgeRow({ clientId, nudge }: { clientId: string; nudge: NutritionNudge }) {
  const router = useRouter();
  const [state, formAction] = useActionState<ReminderState, FormData>(createReminderAction, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form
      action={formAction}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border px-3 py-2.5 ${toneClass[nudge.tone]}`}
    >
      <input type="hidden" name="title" value={nudge.title} />
      <input type="hidden" name="note" value={nudge.detail} />
      <input type="hidden" name="due_on" value={todayISO()} />
      <input type="hidden" name="client_id" value={clientId} />
      <div className="flex min-w-0 items-start gap-2">
        <Icon name={nudge.icon} size={15} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{nudge.title}</p>
          <p className="text-xs text-muted-foreground">{nudge.detail}</p>
        </div>
      </div>
      <AddButton added={!!state.ok} />
    </form>
  );
}

export function NutritionNudges({
  clientId,
  nudges,
}: {
  clientId: string;
  nudges: NutritionNudge[];
}) {
  if (!nudges.length) return null;
  return (
    <div className="mb-3 flex flex-col gap-2">
      {nudges.map((n) => (
        <NudgeRow key={n.key} clientId={clientId} nudge={n} />
      ))}
    </div>
  );
}
