"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { MARKER_CATALOG, MARKER_BY_KEY } from "@/lib/catalog/markers";
import { todayISO } from "@/lib/format";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/markers/actions";
import type { HealthMarker } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save reading"}
    </Button>
  );
}

export function HealthMarkerForm({
  action,
  marker,
  onSuccess,
  onCancel,
}: {
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  marker?: HealthMarker;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});
  const [markerKey, setMarkerKey] = useState(marker?.marker_key ?? "fasting_glucose");
  const [unit, setUnit] = useState(
    marker?.unit ?? MARKER_BY_KEY[marker?.marker_key ?? "fasting_glucose"]?.unit ?? "",
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  function onMarkerChange(key: string) {
    setMarkerKey(key);
    if (key !== "custom") setUnit(MARKER_BY_KEY[key]?.unit ?? "");
    else setUnit("");
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Marker" htmlFor="marker_key" required>
          <Select
            id="marker_key"
            name="marker_key"
            value={markerKey}
            onChange={(e) => onMarkerChange(e.target.value)}
          >
            {MARKER_CATALOG.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
            <option value="custom">Custom marker…</option>
          </Select>
        </Field>
        <Field label="Date" htmlFor="measured_on" required>
          <Input
            id="measured_on"
            name="measured_on"
            type="date"
            max={todayISO()}
            defaultValue={marker?.measured_on ?? todayISO()}
            required
          />
        </Field>
      </div>

      {markerKey === "custom" && (
        <Field label="Marker name" htmlFor="custom_name" required>
          <Input
            id="custom_name"
            name="custom_name"
            defaultValue={marker?.custom_name ?? ""}
            placeholder="e.g. Resting heart rate"
          />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Value" htmlFor="value" required>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.001"
            inputMode="decimal"
            defaultValue={marker ? String(marker.value) : ""}
            required
          />
        </Field>
        <Field label="Unit" htmlFor="unit">
          <Input
            id="unit"
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. mg/dL"
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={marker?.notes ?? ""} />
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
