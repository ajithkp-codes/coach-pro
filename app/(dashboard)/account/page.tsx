import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrainerProfile } from "@/lib/data/session";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Account · CoachPro" };

export default async function AccountPage() {
  const trainer = await getTrainerProfile();

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
          <CardTitle>Privacy &amp; data handling</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            Your clients&apos; data is isolated to your account — no other trainer
            can access it. Data is encrypted in transit and at rest.
          </p>
          <p>
            You record consent when adding each client (required under India&apos;s
            DPDP Act). You can export a client&apos;s full record, or delete it
            permanently, from that client&apos;s page at any time.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
