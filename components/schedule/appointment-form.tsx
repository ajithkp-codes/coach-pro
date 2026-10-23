"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  createAppointmentAction,
  updateAppointmentAction,
  type AppointmentState,
} from "@/app/(dashboard)/schedule/actions";
import type { Appointment } from "@/lib/types";

/** ISO timestamp → a "YYYY-MM-DDThh:mm" value for <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default: next hour, on the hour. */
function defaultStart(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DURATIONS = [30, 45, 60, 75, 90, 120];

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save changes" : "Add appointment"}
    </Button>
  );
}

export function AppointmentForm({
  onSuccess,
  onCancel,
  clients,
  appointment,
  fixedClientId,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  clients: { id: string; full_name: string }[];
  appointment?: Appointment;
  fixedClientId?: string;
}) {
  const editing = Boolean(appointment);
  const action = editing
    ? updateAppointmentAction.bind(null, appointment!.id)
    : createAppointmentAction;
  const [state, formAction] = useActionState<AppointmentState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {fixedClientId && (
        <input type="hidden" name="client_id" value={fixedClientId} />
      )}

      {!fixedClientId && (
        <Field label="Client" htmlFor="client_id" hint="Optional — e.g. for a consultation or block">
          <Select
            id="client_id"
            name="client_id"
            defaultValue={appointment?.client_id ?? "none"}
          >
            <option value="none">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date & time" htmlFor="starts_at" required>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={
              appointment ? toLocalInput(appointment.starts_at) : defaultStart()
            }
            required
          />
        </Field>
        <Field label="Duration" htmlFor="duration_min">
          <Select
            id="duration_min"
            name="duration_min"
            defaultValue={String(appointment?.duration_min ?? 60)}
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" hint="e.g. PT session, Check-in call">
          <Input
            id="title"
            name="title"
            defaultValue={appointment?.title ?? ""}
            placeholder="Session"
          />
        </Field>
        <Field label="Location" htmlFor="location" hint="e.g. Studio, Zoom">
          <Input
            id="location"
            name="location"
            defaultValue={appointment?.location ?? ""}
          />
        </Field>
      </div>

      {editing && (
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={appointment!.status}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="no_show">No-show</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
      )}

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={appointment?.notes ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton editing={editing} />
      </div>
    </form>
  );
}
