"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { todayISO } from "@/lib/format";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/training/actions";
import type { WorkoutSessionWithSets } from "@/lib/types";

interface Row {
  exercise_name: string;
  reps: string;
  weight_kg: string;
  rpe: string;
}

const emptyRow = (exercise = ""): Row => ({
  exercise_name: exercise,
  reps: "",
  weight_kg: "",
  rpe: "",
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save session"}
    </Button>
  );
}

export function SessionForm({
  action,
  session,
  onSuccess,
  onCancel,
}: {
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  session?: WorkoutSessionWithSets;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});
  const [rows, setRows] = useState<Row[]>(
    session && session.sets.length
      ? session.sets.map((s) => ({
          exercise_name: s.exercise_name,
          reps: s.reps != null ? String(s.reps) : "",
          weight_kg: s.weight_kg != null ? String(s.weight_kg) : "",
          rpe: s.rpe != null ? String(s.rpe) : "",
        }))
      : [emptyRow()],
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  function update(i: number, field: keyof Row, value: string) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, emptyRow(rs[rs.length - 1]?.exercise_name ?? "")]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? [emptyRow()] : rs.filter((_, idx) => idx !== i)));
  }

  const setsJson = JSON.stringify(rows.filter((r) => r.exercise_name.trim()));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="sets" value={setsJson} />

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" htmlFor="performed_on" required>
          <Input
            id="performed_on"
            name="performed_on"
            type="date"
            max={todayISO()}
            defaultValue={session?.performed_on ?? todayISO()}
            required
          />
        </Field>
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            name="title"
            defaultValue={session?.title ?? ""}
            placeholder="e.g. Upper body"
          />
        </Field>
        <Field label="Duration (min)" htmlFor="duration_min">
          <Input
            id="duration_min"
            name="duration_min"
            type="number"
            min="0"
            defaultValue={session?.duration_min != null ? String(session.duration_min) : ""}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Exercises &amp; sets</span>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            + Add set
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-1 pr-2 font-medium">Exercise</th>
                <th className="pb-1 px-2 font-medium">Reps</th>
                <th className="pb-1 px-2 font-medium">Weight (kg)</th>
                <th className="pb-1 px-2 font-medium">RPE</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <Input
                      className="h-9"
                      value={r.exercise_name}
                      onChange={(e) => update(i, "exercise_name", e.target.value)}
                      placeholder="e.g. Bench press"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      className="h-9 w-20"
                      type="number"
                      step="0.5"
                      value={r.reps}
                      onChange={(e) => update(i, "reps", e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      className="h-9 w-24"
                      type="number"
                      step="0.5"
                      value={r.weight_kg}
                      onChange={(e) => update(i, "weight_kg", e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-2">
                    <Input
                      className="h-9 w-16"
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={r.rpe}
                      onChange={(e) => update(i, "rpe", e.target.value)}
                    />
                  </td>
                  <td className="py-1 pl-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove set"
                      onClick={() => removeRow(i)}
                    >
                      ✕
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          RPE = rate of perceived exertion (0–10). Leave blank what you don&apos;t track.
        </p>
      </div>

      <Field label="Session notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={session?.notes ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
