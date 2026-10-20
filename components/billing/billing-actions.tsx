"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  startUpgradeAction,
  verifyPaymentAction,
  cancelSubscriptionAction,
} from "@/app/(dashboard)/account/billing/actions";

declare global {
  interface Window {
    // Razorpay Checkout global injected by the external script.
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    const start = await startUpgradeAction();
    if (start.error || !start.subscriptionId || !start.keyId) {
      setError(start.error ?? "Couldn't start checkout.");
      setBusy(false);
      return;
    }
    const ready = await loadCheckout();
    if (!ready || !window.Razorpay) {
      setError("Couldn't load the payment window.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: start.keyId,
      subscription_id: start.subscriptionId,
      name: "CoachPro",
      description: "Pro subscription",
      theme: { color: "#f04e28" },
      handler: async (resp: Record<string, string>) => {
        const v = await verifyPaymentAction({
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_subscription_id: resp.razorpay_subscription_id,
          razorpay_signature: resp.razorpay_signature,
        });
        if (v.ok) router.refresh();
        else setError(v.error ?? "Activation failed.");
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.open();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={upgrade} disabled={busy || disabled}>
        {busy ? "Opening checkout…" : "Upgrade to Pro"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function CancelButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Cancel Pro?"
      description="Your plan will return to Free. You can upgrade again any time."
      trigger={(open) => (
        <Button variant="outline" size="sm" onClick={open}>
          Cancel subscription
        </Button>
      )}
    >
      {(close) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Keep Pro
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await cancelSubscriptionAction();
              close();
              router.refresh();
            }}
          >
            {busy ? "Cancelling…" : "Cancel subscription"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
