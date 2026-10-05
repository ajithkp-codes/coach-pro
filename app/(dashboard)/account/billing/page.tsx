import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { UpgradeButton, CancelButton } from "@/components/billing/billing-actions";
import { getSubscription, planOf, canAddClient } from "@/lib/data/billing";
import { razorpayConfigured } from "@/lib/razorpay";
import { FREE_CLIENT_LIMIT, PRO_PRICE_INR } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Billing · CoachPro" };

export default async function BillingPage() {
  const [sub, usage] = await Promise.all([getSubscription(), canAddClient()]);
  const plan = planOf(sub);
  const configured = razorpayConfigured();

  const freeFeatures = [
    `Up to ${FREE_CLIENT_LIMIT} active clients`,
    "Metrics, markers, goals & training",
    "Charts, progress photos & file sharing",
    "Reminders",
  ];
  const proFeatures = [
    "Unlimited active clients",
    "Everything in Free",
    "Priority support",
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Billing" description="Manage your CoachPro subscription." />

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <Badge tone={plan === "pro" ? "success" : "neutral"} className="capitalize">
            {plan}
          </Badge>
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {plan === "pro" ? (
              <>
                You&apos;re on <span className="font-medium text-foreground">Pro</span>.
                Unlimited clients.
                {sub?.current_end && <> Renews {formatDate(sub.current_end)}.</>}
              </>
            ) : (
              <>
                {usage.count} of {usage.limit} client slots used on the{" "}
                <span className="font-medium text-foreground">Free</span> plan.
              </>
            )}
          </div>
          {plan === "pro" && <CancelButton />}
        </CardBody>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <PlanCard title="Free" price="₹0" features={freeFeatures} current={plan === "free"} />
        <Card className={plan === "pro" ? "border-primary" : undefined}>
          <CardBody className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pro</h3>
              {plan === "pro" && <Badge tone="success">Current</Badge>}
            </div>
            <p className="mt-1">
              <span className="text-2xl font-semibold tracking-tight">
                ₹{PRO_PRICE_INR}
              </span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-success">
                    <Icon name="check" size={16} strokeWidth={2.4} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {plan === "pro" ? (
                <p className="text-sm text-muted-foreground">You&apos;re on Pro. 🎉</p>
              ) : (
                <>
                  <UpgradeButton disabled={!configured} />
                  {!configured && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Payments aren&apos;t configured yet. Add your Razorpay keys to
                      enable upgrades.
                    </p>
                  )}
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <p className="mt-5 text-center text-sm">
        <Link href="/account" className="text-muted-foreground hover:text-foreground hover:underline">
          ← Back to account
        </Link>
      </p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  features,
  current,
}: {
  title: string;
  price: string;
  features: string[];
  current: boolean;
}) {
  return (
    <Card>
      <CardBody className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {current && <Badge>Current</Badge>}
        </div>
        <p className="mt-1">
          <span className="text-2xl font-semibold tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground"> / month</span>
        </p>
        <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-muted-foreground">
                <Icon name="check" size={16} strokeWidth={2.4} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
