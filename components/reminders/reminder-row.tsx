"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { formatDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  toggleReminderAction,
  deleteReminderAction,
} from "@/app/(dashboard)/reminders/actions";
import type { ReminderWithClient } from "@/lib/types";

function dueBadge(due: string) {
  const today = todayISO();
  if (due < today) return { label: `Overdue · ${formatDate(due)}`, tone: "danger" as const };
  if (due === today) return { label: "Due today", tone: "warning" as const };
  return { label: formatDate(due), tone: "neutral" as const };
}

export function ReminderRow({
  r,
  revalClientId,
  showClient,
}: {
  r: ReminderWithClient;
  revalClientId?: string | null;
  showClient?: boolean;
}) {
  // Optimistic local state so toggling/deleting feels instant.
  const [done, setDone] = useState(r.done);
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();
  const clientForReval = revalClientId ?? r.client_id;

  if (removed) return null;
  const badge = done ? null : dueBadge(r.due_on);

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(() => {
      toggleReminderAction(r.id, next, clientForReval);
    });
  }
  function remove() {
    setRemoved(true);
    startTransition(() => {
      deleteReminderAction(r.id, clientForReval);
    });
  }

  return (
    <div className="flex items-start gap-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={cn(
          "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
          done
            ? "border-success bg-success text-white"
            : "border-input text-transparent hover:border-success",
        )}
      >
        <Icon name="check" size={12} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", done && "text-muted-foreground line-through")}>
          {r.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
          {done && <span>Done</span>}
          {showClient && r.client_name && (
            <Link href={`/clients/${r.client_id}`} className="hover:text-foreground hover:underline">
              {r.client_name}
            </Link>
          )}
          {r.note && <span className="truncate">· {r.note}</span>}
        </div>
      </div>

      <Modal
        title="Delete reminder?"
        trigger={(open) => (
          <button
            onClick={open}
            aria-label="Delete reminder"
            className="mt-0.5 text-muted-foreground hover:text-danger"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      >
        {(close) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                close();
                remove();
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
