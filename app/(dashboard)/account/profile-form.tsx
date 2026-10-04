"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { updateProfileAction, type ProfileState } from "./actions";
import type { Trainer } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ProfileForm({ trainer }: { trainer: Trainer | null }) {
  const [state, action] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Your name" htmlFor="full_name" required>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={trainer?.full_name ?? ""}
          required
        />
      </Field>
      <Field label="Business name" htmlFor="business_name" hint="Optional">
        <Input
          id="business_name"
          name="business_name"
          defaultValue={trainer?.business_name ?? ""}
        />
      </Field>
      <Field label="Email" htmlFor="email" hint="Managed by your login — contact support to change.">
        <Input id="email" value={trainer?.email ?? ""} disabled />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-success">Profile updated.</p>}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
