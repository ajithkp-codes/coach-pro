"use client";

import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { AppointmentForm } from "./appointment-form";

export function NewAppointmentButton({
  clients,
  fixedClientId,
  label = "New appointment",
  variant = "primary",
  size = "md",
}: {
  clients: { id: string; full_name: string }[];
  fixedClientId?: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const router = useRouter();
  return (
    <Modal
      title="New appointment"
      description="Schedule a session, call, or consultation."
      trigger={(open) => (
        <Button variant={variant} size={size} onClick={open}>
          <Icon name="plus" size={16} /> {label}
        </Button>
      )}
    >
      {(close) => (
        <AppointmentForm
          clients={clients}
          fixedClientId={fixedClientId}
          onCancel={close}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </Modal>
  );
}
