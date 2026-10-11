import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset password · CoachPro" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardBody>
        <h1 className="text-lg font-semibold">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <div className="mt-5">
          <ForgotPasswordForm />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
