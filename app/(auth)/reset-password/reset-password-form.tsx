"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePasswordAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Update password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    updatePasswordAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="New password" htmlFor="password" hint="At least 8 characters">
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
