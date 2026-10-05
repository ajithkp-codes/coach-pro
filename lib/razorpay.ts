import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_PLAN_ID,
  );
}

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";

function authHeader(): string {
  const token = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString("base64");
  return `Basic ${token}`;
}

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.description ?? "Razorpay request failed");
  }
  return json;
}

export interface RzpSubscription {
  id: string;
  status: string;
  current_end: number | null;
  customer_id?: string | null;
}

/** Create a recurring subscription for the Pro plan. */
export async function createSubscription(notes: Record<string, string>): Promise<RzpSubscription> {
  return call("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 120, // up to ~10 years of monthly cycles
      customer_notify: 1,
      notes,
    }),
  });
}

export async function fetchSubscription(id: string): Promise<RzpSubscription> {
  return call(`/subscriptions/${id}`);
}

export async function cancelSubscription(id: string): Promise<RzpSubscription> {
  return call(`/subscriptions/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });
}

/** Verify the signature Razorpay Checkout returns for a subscription payment. */
export function verifyCheckoutSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verify a Razorpay webhook body against the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function toISO(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}
