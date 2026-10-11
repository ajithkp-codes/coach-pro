import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Set a new password · CoachPro" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Card>
      <CardBody>
        <h1 className="text-lg font-semibold">Set a new password</h1>
        {user ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>
            <div className="mt-5">
              <ResetPasswordForm />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a fresh one and
              try again.
            </p>
            <p className="mt-5">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Request a new reset link
              </Link>
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
