"use client";

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
  const badge = r.done ? null : dueBadge(r.due_on);

  return (
    <div className="flex items-start gap-3 py-2.5">
      <form action={toggleReminderAction.bind(null, r.id, !r.done, revalClientId ?? r.client_id)}>
        <button
          type="submit"
          aria-label={r.done ? "Mark not done" : "Mark done"}
          className={cn(
            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
            r.done
              ? "border-success bg-success text-white"
              : "border-input text-transparent hover:border-success",
          )}
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", r.done && "text-muted-foreground line-through")}>
          {r.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
          {r.done && r.done_at && <span>Done {formatDate(r.done_at)}</span>}
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
            <Icon name="plus" size={16} className="rotate-45" />
          </button>
        )}
      >
        {(close) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <form action={deleteReminderAction.bind(null, r.id, revalClientId ?? r.client_id)}>
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
