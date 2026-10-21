import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · CoachPro" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <Card>
      <CardBody>
        <h1 className="hdisp text-[1.75rem] text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your trainer workspace.
        </p>
        {error === "link-expired" && (
          <p className="mt-4 rounded-[var(--radius)] bg-warning-bg px-3 py-2 text-sm text-warning">
            That link was invalid or expired. Please sign in or request a new
            reset link.
          </p>
        )}
        <div className="mt-5">
          <LoginForm next={next} />
        </div>
        <p className="mt-3 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
