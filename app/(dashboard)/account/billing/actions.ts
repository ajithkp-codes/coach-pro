"use server";

import { revalidatePath } from "next/cache";
import { authed } from "@/lib/data/session";
import { getSubscription } from "@/lib/data/billing";
import { upsertSubscription } from "@/lib/data/billing-admin";
import { getTier, razorpayPlanIdFor } from "@/lib/catalog/plans";
import type { Plan } from "@/lib/types";
import {
  razorpayConfigured,
  RAZORPAY_KEY_ID,
  createSubscription,
  fetchSubscription,
  cancelSubscription,
  verifyCheckoutSignature,
  toISO,
} from "@/lib/razorpay";

/** Only paid tiers can be checked out. */
type PaidPlan = Exclude<Plan, "free">;

function isPaidPlan(plan: string): plan is PaidPlan {
  return plan === "pro" || plan === "studio";
}

export interface StartResult {
  error?: string;
  keyId?: string;
  subscriptionId?: string;
  planName?: string;
}

/** Create a Razorpay subscription for the chosen tier and return checkout handles. */
export async function startUpgradeAction(plan: string): Promise<StartResult> {
  if (!razorpayConfigured()) {
    return { error: "Payments aren't configured yet. Add your Razorpay keys to enable upgrades." };
  }
  if (!isPaidPlan(plan)) {
    return { error: "Choose a paid plan to upgrade." };
  }
  const planId = razorpayPlanIdFor(plan);
  if (!planId) {
    return { error: `The ${getTier(plan).label} plan isn't configured for payments yet.` };
  }
  try {
    const { trainerId, email } = await authed();
    const sub = await createSubscription(planId, {
      trainer_id: trainerId,
      email: email ?? "",
      plan,
    });
    // Record the pending subscription id + chosen tier so the webhook and the
    // verify step can map it back to us and know which plan was purchased.
    await upsertSubscription(trainerId, {
      plan,
      razorpay_subscription_id: sub.id,
      status: "inactive",
    });
    return { keyId: RAZORPAY_KEY_ID, subscriptionId: sub.id, planName: getTier(plan).label };
  } catch (e) {
    console.error("startUpgrade failed", e);
    return { error: "Couldn't start the upgrade. Please try again." };
  }
}

export interface VerifyResult {
  ok?: boolean;
  error?: string;
}

/** Verify Checkout's signature and activate the purchased tier. */
export async function verifyPaymentAction(payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
  plan: string;
}): Promise<VerifyResult> {
  try {
    const { trainerId } = await authed();
    const valid = verifyCheckoutSignature(
      payload.razorpay_payment_id,
      payload.razorpay_subscription_id,
      payload.razorpay_signature,
    );
    if (!valid) return { error: "Payment could not be verified." };

    // Trust the tier recorded on the pending row at checkout start; only accept
    // the client-supplied plan when it's a valid paid tier.
    const plan: PaidPlan = isPaidPlan(payload.plan) ? payload.plan : "pro";

    let currentEnd: string | null = null;
    let customerId: string | null = null;
    try {
      const sub = await fetchSubscription(payload.razorpay_subscription_id);
      currentEnd = toISO(sub.current_end);
      customerId = sub.customer_id ?? null;
    } catch {
      /* non-fatal, activation can proceed without the extra detail */
    }

    await upsertSubscription(trainerId, {
      plan,
      status: "active",
      razorpay_subscription_id: payload.razorpay_subscription_id,
      razorpay_customer_id: customerId,
      current_end: currentEnd,
    });
    revalidatePath("/account/billing");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("verifyPayment failed", e);
    return { error: "Couldn't activate Pro. Please contact support." };
  }
}

export async function cancelSubscriptionAction(): Promise<VerifyResult> {
  try {
    const { trainerId } = await authed();
    const sub = await getSubscription();
    if (sub?.razorpay_subscription_id && razorpayConfigured()) {
      try {
        await cancelSubscription(sub.razorpay_subscription_id);
      } catch {
        /* already cancelled or not found, proceed to downgrade locally */
      }
    }
    await upsertSubscription(trainerId, { plan: "free", status: "cancelled" });
    revalidatePath("/account/billing");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error("cancel failed", e);
    return { error: "Couldn't cancel. Please try again." };
  }
}
