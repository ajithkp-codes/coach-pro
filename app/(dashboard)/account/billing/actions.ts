"use server";

import { revalidatePath } from "next/cache";
import { authed } from "@/lib/data/session";
import { getSubscription } from "@/lib/data/billing";
import { upsertSubscription } from "@/lib/data/billing-admin";
import {
  razorpayConfigured,
  RAZORPAY_KEY_ID,
  createSubscription,
  fetchSubscription,
  cancelSubscription,
  verifyCheckoutSignature,
  toISO,
} from "@/lib/razorpay";

export interface StartResult {
  error?: string;
  keyId?: string;
  subscriptionId?: string;
}

/** Create a Razorpay subscription and return the checkout handles. */
export async function startUpgradeAction(): Promise<StartResult> {
  if (!razorpayConfigured()) {
    return { error: "Payments aren't configured yet. Add your Razorpay keys to enable upgrades." };
  }
  try {
    const { trainerId, email } = await authed();
    const sub = await createSubscription({ trainer_id: trainerId, email: email ?? "" });
    // Record the pending subscription id so the webhook can map it back to us.
    await upsertSubscription(trainerId, {
      razorpay_subscription_id: sub.id,
      status: "inactive",
    });
    return { keyId: RAZORPAY_KEY_ID, subscriptionId: sub.id };
  } catch (e) {
    console.error("startUpgrade failed", e);
    return { error: "Couldn't start the upgrade. Please try again." };
  }
}

export interface VerifyResult {
  ok?: boolean;
  error?: string;
}

/** Verify Checkout's signature and activate Pro. */
export async function verifyPaymentAction(payload: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): Promise<VerifyResult> {
  try {
    const { trainerId } = await authed();
    const valid = verifyCheckoutSignature(
      payload.razorpay_payment_id,
      payload.razorpay_subscription_id,
      payload.razorpay_signature,
    );
    if (!valid) return { error: "Payment could not be verified." };

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
      plan: "pro",
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
