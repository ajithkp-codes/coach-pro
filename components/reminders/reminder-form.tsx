"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { todayISO } from "@/lib/format";
import {
  createReminderAction,
  type ReminderState,
} from "@/app/(dashboard)/reminders/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Add reminder"}
    </Button>
  );
}

export function ReminderForm({
  onSuccess,
  onCancel,
  fixedClientId,
  clients,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  fixedClientId?: string;
  clients?: { id: string; full_name: string }[];
}) {
  const [state, action] = useActionState<ReminderState, FormData>(
    createReminderAction,
    {},
  );

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-5">
      {fixedClientId && <input type="hidden" name="client_id" value={fixedClientId} />}

      <Field label="Reminder" htmlFor="title" required>
        <Input id="title" name="title" placeholder="e.g. Update Aarav's measurements" required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Due date" htmlFor="due_on" required>
          <Input id="due_on" name="due_on" type="date" defaultValue={todayISO()} required />
        </Field>
        {!fixedClientId && clients && (
          <Field label="Client" htmlFor="client_id" hint="Optional">
            <Select id="client_id" name="client_id" defaultValue="none">
              <option value="none">General (no client)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <Field label="Note" htmlFor="note">
        <Textarea id="note" name="note" />
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
