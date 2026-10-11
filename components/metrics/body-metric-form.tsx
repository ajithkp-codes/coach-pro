"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { todayISO } from "@/lib/format";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/metrics/actions";
import type { BodyMetric } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save measurement"}
    </Button>
  );
}

export function BodyMetricForm({
  action,
  metric,
  onSuccess,
  onCancel,
}: {
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  metric?: BodyMetric;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Date" htmlFor="measured_on" required>
        <Input
          id="measured_on"
          name="measured_on"
          type="date"
          max={todayISO()}
          defaultValue={metric?.measured_on ?? todayISO()}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {BODY_METRIC_FIELDS.map((f) => (
          <Field key={f.key} label={`${f.label} (${f.unit})`} htmlFor={f.key}>
            <Input
              id={f.key}
              name={f.key}
              type="number"
              step="0.01"
              inputMode="decimal"
              defaultValue={
                metric?.[f.key as keyof BodyMetric] != null
                  ? String(metric[f.key as keyof BodyMetric])
                  : ""
              }
            />
          </Field>
        ))}
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={metric?.notes ?? ""} />
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
