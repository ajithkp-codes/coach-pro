"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { AppointmentForm } from "./appointment-form";
import { cn } from "@/lib/utils";
import {
  setAppointmentStatusAction,
  deleteAppointmentAction,
} from "@/app/(dashboard)/schedule/actions";
import type { AppointmentStatus, AppointmentWithClient } from "@/lib/types";

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  no_show: { label: "No-show", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function AppointmentRow({
  a,
  clients,
  showDate,
}: {
  a: AppointmentWithClient;
  clients: { id: string; full_name: string }[];
  showDate?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AppointmentStatus>(a.status);
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();

  if (removed) return null;
  const meta = STATUS_META[status];

  function mark(next: AppointmentStatus) {
    setStatus(next);
    startTransition(() => {
      setAppointmentStatusAction(a.id, next, a.client_id);
    });
  }
  function remove() {
    setRemoved(true);
    startTransition(() => {
      deleteAppointmentAction(a.id, a.client_id);
    });
  }

  const when = new Date(a.starts_at);
  const dateLabel = when.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const done = status !== "scheduled";

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex w-16 shrink-0 flex-col items-center">
        <span className="text-sm font-semibold tabular-nums">{formatTime(a.starts_at)}</span>
        {showDate && <span className="text-[11px] text-muted-foreground">{dateLabel}</span>}
        <span className="mt-0.5 text-[11px] text-muted-foreground">{a.duration_min}m</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("text-sm font-medium", done && status === "cancelled" && "text-muted-foreground line-through")}>
            {a.title || "Session"}
          </p>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {a.client_id && a.client_name ? (
            <Link href={`/clients/${a.client_id}`} className="hover:text-foreground hover:underline">
              {a.client_name}
            </Link>
          ) : (
            <span>No client</span>
          )}
          {a.location && <span>· {a.location}</span>}
          {a.notes && <span className="truncate">· {a.notes}</span>}
        </div>

        {status === "scheduled" && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => mark("completed")}>
              <Icon name="check" size={14} /> Done
            </Button>
            <Button size="sm" variant="outline" onClick={() => mark("no_show")}>
              No-show
            </Button>
            <Button size="sm" variant="ghost" onClick={() => mark("cancelled")}>
              Cancel
            </Button>
          </div>
        )}
        {done && status !== "cancelled" && (
          <button
            type="button"
            onClick={() => mark("scheduled")}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Reset to scheduled
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Modal
          title="Edit appointment"
          trigger={(open) => (
            <button
              onClick={open}
              aria-label="Edit appointment"
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="chevronRight" size={16} />
            </button>
          )}
        >
          {(close) => (
            <AppointmentForm
              clients={clients}
              appointment={a}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
        <Modal
          title="Delete appointment?"
          trigger={(open) => (
            <button
              onClick={open}
              aria-label="Delete appointment"
              className="text-muted-foreground hover:text-danger"
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
    </div>
  );
}
