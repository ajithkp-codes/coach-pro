"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState, FormData>(signupAction, {});

  if (state.notice) {
    return (
      <div className="rounded-[var(--radius)] bg-info-bg px-4 py-3 text-sm text-primary">
        {state.notice}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Your name" htmlFor="fullName" required>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Business name" htmlFor="businessName" hint="Optional">
        <Input id="businessName" name="businessName" autoComplete="organization" />
      </Field>
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
