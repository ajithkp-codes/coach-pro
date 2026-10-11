"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { PlanState } from "@/app/(dashboard)/clients/[id]/training/plan-actions";
import type { WorkoutPlan, PlanDay, PlanItem } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyItem = (): PlanItem => ({ exercise_name: "", sets: "", reps: "", weight: "", notes: "" });
const emptyDay = (day: string): PlanDay => ({ day, title: "", items: [emptyItem()] });

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save plan"}
    </Button>
  );
}

export function PlanEditor({
  action,
  plan,
  onSuccess,
  onCancel,
}: {
  action: (prev: PlanState, formData: FormData) => Promise<PlanState>;
  plan?: WorkoutPlan;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<PlanState, FormData>(action, {});
  const [days, setDays] = useState<PlanDay[]>(
    plan && plan.days.length ? plan.days : [emptyDay("Mon")],
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  function updateDay(i: number, patch: Partial<PlanDay>) {
    setDays((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addDay() {
    const used = new Set(days.map((d) => d.day));
    const next = WEEKDAYS.find((w) => !used.has(w)) ?? "Mon";
    setDays((ds) => [...ds, emptyDay(next)]);
  }
  function removeDay(i: number) {
    setDays((ds) => (ds.length === 1 ? ds : ds.filter((_, idx) => idx !== i)));
  }
  function updateItem(di: number, ii: number, patch: Partial<PlanItem>) {
    setDays((ds) =>
      ds.map((d, idx) =>
        idx === di
          ? { ...d, items: d.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : d,
      ),
    );
  }
  function addItem(di: number) {
    setDays((ds) => ds.map((d, idx) => (idx === di ? { ...d, items: [...d.items, emptyItem()] } : d)));
  }
  function removeItem(di: number, ii: number) {
    setDays((ds) =>
      ds.map((d, idx) => (idx === di ? { ...d, items: d.items.filter((_, j) => j !== ii) } : d)),
    );
  }

  // Serialize, dropping exercises with no name.
  const daysJson = JSON.stringify(
    days.map((d) => ({ ...d, items: d.items.filter((it) => it.exercise_name.trim()) })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="days" value={daysJson} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Plan name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={plan?.name} placeholder="e.g. Strength block, weeks 1-4" required />
        </Field>
        <Field label=" " htmlFor="is_active">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={plan?.is_active ?? true}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Set as the client&apos;s active plan
          </label>
        </Field>
      </div>

      <div className="flex flex-col gap-4">
        {days.map((d, di) => (
          <div key={di} className="rounded-[var(--radius)] border border-border p-3">
            <div className="flex items-center gap-2">
              <Select
                className="h-9 w-24"
                value={d.day}
                onChange={(e) => updateDay(di, { day: e.target.value })}
                aria-label="Day"
              >
                {WEEKDAYS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </Select>
              <Input
                className="h-9 flex-1"
                value={d.title}
                onChange={(e) => updateDay(di, { title: e.target.value })}
                placeholder="Focus (e.g. Push, Legs, Rest)"
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove day" onClick={() => removeDay(di)}>
                <Icon name="plus" size={16} className="rotate-45" />
              </Button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-1 pr-2 font-medium">Exercise</th>
                    <th className="pb-1 px-2 font-medium">Sets</th>
                    <th className="pb-1 px-2 font-medium">Reps</th>
                    <th className="pb-1 px-2 font-medium">Weight</th>
                    <th className="pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((it, ii) => (
                    <tr key={ii}>
                      <td className="py-1 pr-2">
                        <Input className="h-9" value={it.exercise_name} onChange={(e) => updateItem(di, ii, { exercise_name: e.target.value })} placeholder="e.g. Bench press" />
                      </td>
                      <td className="py-1 px-2">
                        <Input className="h-9 w-16" value={it.sets} onChange={(e) => updateItem(di, ii, { sets: e.target.value })} placeholder="3" />
                      </td>
                      <td className="py-1 px-2">
                        <Input className="h-9 w-20" value={it.reps} onChange={(e) => updateItem(di, ii, { reps: e.target.value })} placeholder="8-12" />
                      </td>
                      <td className="py-1 px-2">
                        <Input className="h-9 w-24" value={it.weight} onChange={(e) => updateItem(di, ii, { weight: e.target.value })} placeholder="60kg / RPE 8" />
                      </td>
                      <td className="py-1 pl-1">
                        <Button type="button" variant="ghost" size="icon" aria-label="Remove exercise" onClick={() => removeItem(di, ii)}>
                          <Icon name="plus" size={14} className="rotate-45" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addItem(di)}>
              <Icon name="plus" size={14} /> Add exercise
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addDay}>
        <Icon name="plus" size={14} /> Add day
      </Button>

      <Field label="Plan notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={plan?.notes ?? ""} placeholder="Warm-up, progression rules, anything the client should know." />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <SubmitButton />
      </div>
    </form>
  );
}
