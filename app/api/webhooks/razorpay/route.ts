import { NextResponse } from "next/server";
import { verifyWebhookSignature, toISO } from "@/lib/razorpay";
import {
  upsertSubscription,
  trainerByRazorpaySubscription,
} from "@/lib/data/billing-admin";

/**
 * Razorpay webhook. Keeps subscription state in sync for events that happen
 * outside the checkout flow (renewals, cancellations, payment failures).
 * Configure the endpoint + secret in the Razorpay dashboard.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { subscription?: { entity?: { id?: string; current_end?: number } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const sub = event.payload?.subscription?.entity;
  if (!sub?.id) return NextResponse.json({ received: true });

  const trainerId = await trainerByRazorpaySubscription(sub.id);
  if (!trainerId) return NextResponse.json({ received: true });

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
      // Keep the tier already recorded at checkout (Pro or Studio); only move
      // the subscription to active and roll the renewal date forward.
      await upsertSubscription(trainerId, {
        status: "active",
        current_end: toISO(sub.current_end),
      });
      break;
    case "subscription.halted":
    case "subscription.pending":
      await upsertSubscription(trainerId, { status: "past_due" });
      break;
    case "subscription.cancelled":
    case "subscription.completed":
      await upsertSubscription(trainerId, { plan: "free", status: "cancelled" });
      break;
  }

  return NextResponse.json({ received: true });
}
