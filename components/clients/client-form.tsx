"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { FormState } from "@/app/(dashboard)/clients/actions";
import type { Client } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ClientForm({
  action,
  client,
  submitLabel = "Save client",
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  client?: Client;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Full name" htmlFor="full_name" required>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={client?.full_name}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Sex" htmlFor="sex">
          <Select id="sex" name="sex" defaultValue={client?.sex ?? "unspecified"}>
            <option value="unspecified">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Date of birth" htmlFor="date_of_birth">
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={client?.date_of_birth ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" hint="Anything useful to remember about this client.">
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
      </Field>

      <label className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-muted/50 p-3">
        <input
          type="checkbox"
          name="consent_given"
          value="true"
          defaultChecked={client?.consent_given ?? false}
          className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
        />
        <span className="text-sm text-foreground">
          The client has consented to me storing their personal and health data in
          CoachPro.
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Required under India&apos;s DPDP Act before you record health data.
          </span>
        </span>
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        {cancelHref && (
          <a
            href={cancelHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}
