"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { MARKER_CATALOG } from "@/lib/catalog/markers";
import { todayISO } from "@/lib/format";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/goals/actions";
import type { Goal } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save goal"}
    </Button>
  );
}

export function GoalForm({
  action,
  goal,
  onSuccess,
  onCancel,
}: {
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  goal?: Goal;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Goal" htmlFor="title" required>
        <Input
          id="title"
          name="title"
          defaultValue={goal?.title}
          placeholder="e.g. Lose 5 kg, Lower fasting glucose"
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue={goal?.category ?? "health"}>
            <option value="health">Health</option>
            <option value="workout">Workout</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={goal?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="achieved">Achieved</option>
            <option value="paused">Paused</option>
            <option value="dropped">Dropped</option>
          </Select>
        </Field>
      </div>

      <Field
        label="Linked measurement"
        htmlFor="metric_key"
        hint="Link to a metric or marker to auto-track progress from recorded readings."
      >
        <Select id="metric_key" name="metric_key" defaultValue={goal?.metric_key ?? "none"}>
          <option value="none">Not linked (track manually)</option>
          <optgroup label="Body metrics">
            {BODY_METRIC_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Health markers">
            {MARKER_CATALOG.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </optgroup>
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Start value" htmlFor="start_value">
          <Input
            id="start_value"
            name="start_value"
            type="number"
            step="0.001"
            defaultValue={goal?.start_value != null ? String(goal.start_value) : ""}
          />
        </Field>
        <Field label="Target value" htmlFor="target_value">
          <Input
            id="target_value"
            name="target_value"
            type="number"
            step="0.001"
            defaultValue={goal?.target_value != null ? String(goal.target_value) : ""}
          />
        </Field>
        <Field label="Unit" htmlFor="target_unit">
          <Input
            id="target_unit"
            name="target_unit"
            defaultValue={goal?.target_unit ?? ""}
            placeholder="kg, %, mg/dL"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Target date" htmlFor="target_date">
          <Input
            id="target_date"
            name="target_date"
            type="date"
            min={todayISO()}
            defaultValue={goal?.target_date ?? ""}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={goal?.description ?? ""}
        />
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
