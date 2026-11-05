import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { UpgradeButton, CancelButton } from "@/components/billing/billing-actions";
import { getSubscription, planOf, canAddClient, getEntitlement } from "@/lib/data/billing";
import { razorpayConfigured } from "@/lib/razorpay";
import {
  PLAN_TIERS,
  getTier,
  effectiveMonthlyPriceInr,
  usdFromInr,
  LAUNCH_PROMO,
  type PlanTier,
} from "@/lib/catalog/plans";
import { formatDate } from "@/lib/format";
import type { Plan } from "@/lib/types";

export const metadata = { title: "Billing · CoachPro" };

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function BillingPage() {
  const [sub, usage, entitlement] = await Promise.all([
    getSubscription(),
    canAddClient(),
    getEntitlement(),
  ]);
  // The actual paid plan (Free while on trial) drives the "Current" badge and
  // which upgrade CTAs show — a trial user can still subscribe to Pro/Studio.
  const plan = planOf(sub);
  const current = getTier(plan);
  const configured = razorpayConfigured();
  const promo = LAUNCH_PROMO.active;
  const onTrial = entitlement.isTrial;
  const trialTier = getTier(entitlement.plan);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Billing" description="Manage your CoachPro subscription." />

      {promo && (
        <div className="mb-5 flex items-center gap-2 rounded-[var(--radius)] border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
          <Icon name="sparkles" size={15} className="text-primary" />
          <span>
            <span className="font-semibold text-primary">{LAUNCH_PROMO.label}</span>{" "}
            on all paid plans, for a limited time.
          </span>
        </div>
      )}

      {onTrial && (
        <div className="mb-5 flex items-start gap-2 rounded-[var(--radius)] border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
          <Icon name="sparkles" size={15} className="mt-0.5 text-primary" />
          <span>
            <span className="font-semibold text-primary">
              You&apos;re on a free {trialTier.label} trial
            </span>{" "}
            with {entitlement.trialDaysLeft}{" "}
            {entitlement.trialDaysLeft === 1 ? "day" : "days"} left
            {entitlement.trialEndsAt && <> (until {formatDate(entitlement.trialEndsAt)})</>}.
            Subscribe anytime to keep {trialTier.label} features; otherwise you&apos;ll move to
            Free when the trial ends.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          {onTrial ? (
            <Badge tone="info" className="capitalize">{trialTier.label} trial</Badge>
          ) : (
            <Badge tone={plan === "free" ? "neutral" : "success"} className="capitalize">
              {current.label}
            </Badge>
          )}
        </CardHeader>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {usage.count} of {usage.limit ?? "unlimited"} client slots used on{" "}
            {onTrial ? (
              <>
                your <span className="font-medium text-foreground">{trialTier.label} trial</span>.
                Reverts to Free in {entitlement.trialDaysLeft}{" "}
                {entitlement.trialDaysLeft === 1 ? "day" : "days"}.
              </>
            ) : (
              <>
                the <span className="font-medium text-foreground">{current.label}</span> plan.
                {plan !== "free" && sub?.current_end && (
                  <> Renews {formatDate(sub.current_end)}.</>
                )}
              </>
            )}
          </div>
          {plan !== "free" && <CancelButton />}
        </CardBody>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {PLAN_TIERS.map((tier) => (
          <PlanCard
            key={tier.key}
            tier={tier}
            currentPlan={plan}
            currentRank={current.rank}
            configured={configured}
            promo={promo}
          />
        ))}
      </div>

      {!configured && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Payments aren&apos;t configured yet. Add your Razorpay keys and plan IDs to enable upgrades.
        </p>
      )}

      <p className="mt-5 text-center text-sm">
        <Link href="/account" className="text-muted-foreground hover:text-foreground hover:underline">
          ← Back to account
        </Link>
      </p>
    </div>
  );
}

function PlanCard({
  tier,
  currentPlan,
  currentRank,
  configured,
  promo,
}: {
  tier: PlanTier;
  currentPlan: Plan;
  currentRank: number;
  configured: boolean;
  promo: boolean;
}) {
  const isCurrent = tier.key === currentPlan;
  const isPaid = tier.priceInr > 0;
  const effective = effectiveMonthlyPriceInr(tier.key);
  const discounted = promo && isPaid && effective < tier.priceInr;
  const highlight = tier.key === "pro"; // the recommended tier

  return (
    <Card className={isCurrent ? "border-primary" : highlight ? "border-primary/40" : undefined}>
      <CardBody className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{tier.label}</h3>
          {isCurrent ? (
            <Badge tone="success">Current</Badge>
          ) : highlight ? (
            <Badge tone="info">Popular</Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{tier.tagline}</p>

        <p className="mt-3 flex items-baseline gap-2">
          {discounted && (
            <span className="text-sm text-muted-foreground line-through">
              {formatInr(tier.priceInr)}
            </span>
          )}
          <span className="text-2xl font-semibold tracking-tight">{formatInr(effective)}</span>
          {isPaid && (
            <span className="text-sm text-muted-foreground">(${usdFromInr(effective)})</span>
          )}
          {isPaid && <span className="text-sm text-muted-foreground">/ month</span>}
        </p>
        {discounted && (
          <p className="mt-0.5 text-xs font-medium text-primary">
            {LAUNCH_PROMO.percentOff}% off launch price
          </p>
        )}

        <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className={isPaid ? "mt-0.5 text-success" : "mt-0.5 text-muted-foreground"}>
                <Icon name="check" size={16} strokeWidth={2.4} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <PlanCta
            tier={tier}
            isCurrent={isCurrent}
            currentRank={currentRank}
            configured={configured}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function PlanCta({
  tier,
  isCurrent,
  currentRank,
  configured,
}: {
  tier: PlanTier;
  isCurrent: boolean;
  currentRank: number;
  configured: boolean;
}) {
  if (isCurrent) {
    return <p className="text-center text-sm text-muted-foreground">You&apos;re on this plan.</p>;
  }
  // Free card while on a paid plan: downgrade happens by cancelling.
  if (tier.priceInr === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Cancel your subscription to return to Free.
      </p>
    );
  }
  // A paid tier below the current one is already included (e.g. Pro while on Studio).
  if (tier.rank < currentRank) {
    return <p className="text-center text-xs text-muted-foreground">Included in your plan.</p>;
  }
  // An upgrade path.
  return (
    <UpgradeButton
      plan={tier.key as "pro" | "studio"}
      planLabel={tier.label}
      variant={tier.key === "pro" ? "primary" : "outline"}
      disabled={!configured}
    />
  );
}
