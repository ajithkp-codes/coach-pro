"use client";

import { Button, DeleteButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  setPlanAction,
  setAdminAction,
  setApprovedAction,
} from "@/app/(dashboard)/admin/actions";
import type { Plan } from "@/lib/types";

export function AdminActions({
  trainerId,
  plan,
  isAdmin,
  approved,
}: {
  trainerId: string;
  plan: Plan;
  isAdmin: boolean;
  approved: boolean;
}) {
  const nextPlan: Plan = plan === "pro" ? "free" : "pro";

  return (
    <div className="flex flex-wrap gap-2">
      {!approved ? (
        <form action={setApprovedAction.bind(null, trainerId, true)}>
          <Button type="submit" size="sm">Reactivate account</Button>
        </form>
      ) : (
        <Modal
          title="Suspend access?"
          description="This trainer will be signed out and locked out of the app until you reactivate them. Their clients and data are preserved."
          trigger={(open) => (
            <Button variant="outline" size="sm" onClick={open}>Suspend access</Button>
          )}
        >
          {(close) => (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <form action={setApprovedAction.bind(null, trainerId, false)}>
                <DeleteButton label="Suspend access" />
              </form>
            </div>
          )}
        </Modal>
      )}
      <Modal
        title={plan === "pro" ? "Downgrade to Free?" : "Grant Pro?"}
        description={
          plan === "pro"
            ? "This sets the trainer's plan to Free (cancelled). It does not refund any Razorpay charge."
            : "This comps the trainer a Pro plan without a payment. Use for trials or support."
        }
        trigger={(open) => (
          <Button variant="outline" size="sm" onClick={open}>
            {plan === "pro" ? "Set to Free" : "Grant Pro"}
          </Button>
        )}
      >
        {(close) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <form action={setPlanAction.bind(null, trainerId, nextPlan)}>
              <Button type="submit">{plan === "pro" ? "Set to Free" : "Grant Pro"}</Button>
            </form>
          </div>
        )}
      </Modal>

      <Modal
        title={isAdmin ? "Remove admin access?" : "Make platform admin?"}
        description={
          isAdmin
            ? "This trainer will lose access to the admin area."
            : "This trainer will be able to see all trainers and platform data (not client health data)."
        }
        trigger={(open) => (
          <Button variant={isAdmin ? "outline" : "secondary"} size="sm" onClick={open}>
            {isAdmin ? "Remove admin" : "Make admin"}
          </Button>
        )}
      >
        {(close) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <form action={setAdminAction.bind(null, trainerId, !isAdmin)}>
              <Button type="submit" variant={isAdmin ? "danger" : "primary"}>
                {isAdmin ? "Remove admin" : "Make admin"}
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
