import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create account · CoachPro" };

export default function SignupPage() {
  return (
    <Card>
      <CardBody>
        <h1 className="hdisp text-[1.75rem] text-ink">Create your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start monitoring your clients in minutes.
        </p>
        <div className="mt-5">
          <SignupForm />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
