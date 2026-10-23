"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useTheme } from "@/components/theme-provider";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, {});
  const { setTheme } = useTheme();

  // Signing in resets the workspace to its light-mode default.
  function dispatch(formData: FormData) {
    setTheme("light");
    return action(formData);
  }

  return (
    <form action={dispatch} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
