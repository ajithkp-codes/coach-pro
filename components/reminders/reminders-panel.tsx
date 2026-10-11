"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { ReminderForm } from "./reminder-form";
import { ReminderRow } from "./reminder-row";
import type { Reminder } from "@/lib/types";

export function RemindersPanel({
  clientId,
  reminders,
}: {
  clientId: string;
  reminders: Reminder[];
}) {
  const router = useRouter();
  const rows = reminders.map((r) => ({ ...r, client_name: null }));
  const open = rows.filter((r) => !r.done);
  const done = rows.filter((r) => r.done);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {open.length} open reminder{open.length === 1 ? "" : "s"} for this client
        </p>
        <Modal
          title="Add reminder"
          description="A to-do for yourself about this client."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Add reminder
            </Button>
          )}
        >
          {(close) => (
            <ReminderForm
              fixedClientId={clientId}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No reminders"
          description="Add a reminder to follow up or update this client."
        />
      ) : (
        <Card className="px-4 py-1">
          <div className="divide-y divide-border">
            {[...open, ...done].map((r) => (
              <ReminderRow key={r.id} r={r} revalClientId={clientId} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
