import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSegmented } from "@/components/theme-toggle";
import { getTrainerProfile } from "@/lib/data/session";
import { getSubscription, planOf } from "@/lib/data/billing";
import { getTier } from "@/lib/catalog/plans";
import { logoutAction } from "@/app/(auth)/actions";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Account · CoachPro" };

export default async function AccountPage() {
  const [trainer, sub] = await Promise.all([
    getTrainerProfile(),
    getSubscription(),
  ]);
  const plan = planOf(sub);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Account"
        description="Your profile and how CoachPro handles client data."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <ProfileForm trainer={trainer} />
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Choose light, dark, or match your device.
          </p>
          <ThemeSegmented />
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <Badge tone={plan === "free" ? "neutral" : "success"} className="capitalize">
            {plan}
          </Badge>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {plan === "free"
              ? "You're on the Free plan."
              : `You're on ${getTier(plan).label}.`}
          </p>
          <ButtonLink href="/account/billing" variant="outline" size="sm">
            Manage billing
          </ButtonLink>
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Privacy &amp; data handling</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Your clients&apos; data is isolated to your account. No other trainer
            can access it. Data is encrypted in transit and at rest.
          </p>
          <p>
            You record consent when adding each client (required under India&apos;s
            DPDP Act). You can export a client&apos;s full record, or delete it
            permanently, from that client&apos;s page at any time.
          </p>
        </CardBody>
      </Card>

      <form action={logoutAction} className="mt-6 sm:hidden">
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </div>
  );
}
