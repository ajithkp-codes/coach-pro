"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { ReminderForm } from "./reminder-form";
import { ReminderRow } from "./reminder-row";
import type { ReminderWithClient } from "@/lib/types";

export function DashboardReminders({
  reminders,
  clients,
}: {
  reminders: ReminderWithClient[];
  clients: { id: string; full_name: string }[];
}) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
        <Modal
          title="Add reminder"
          description="A to-do for yourself, optionally about a client."
          trigger={(open) => (
            <Button variant="outline" size="sm" onClick={open}>
              <Icon name="plus" size={15} /> Add
            </Button>
          )}
        >
          {(close) => (
            <ReminderForm
              clients={clients}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
      </CardHeader>
      <CardBody>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing due. Add a reminder to follow up with a client.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {reminders.slice(0, 6).map((r) => (
              <ReminderRow key={r.id} r={r} showClient />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
