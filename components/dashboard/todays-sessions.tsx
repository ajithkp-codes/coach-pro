"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { markMissedAction, clearMissedAction } from "@/app/(dashboard)/schedule/actions";
import { getModality } from "@/lib/catalog/modalities";
import type { RosterEntry, RosterEvent, RosterStatus } from "@/lib/data/roster";

type Filter = "all" | "pending" | "done" | "missed";

const STATUS_META: Record<RosterStatus, { label: string; tone: "success" | "danger" | "neutral" }> = {
  done: { label: "Showed up", tone: "success" },
  missed: { label: "Missed", tone: "danger" },
  pending: { label: "Expected", tone: "neutral" },
};

function SessionRow({
  entry,
  dateISO,
}: {
  entry: RosterEntry;
  dateISO: string;
}) {
  // Optimistic status the trainer can flip from this row.
  const [status, setStatus] = useState<RosterStatus>(entry.status);
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[status];
  const logHref = `/clients/${entry.clientId}/training/log?plan=${entry.planId}&day=${entry.dayIndex}`;

  const mark = (next: RosterStatus) => {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        if (next === "missed") {
          await markMissedAction(entry.clientId, dateISO, entry.dayTitle);
        } else {
          await clearMissedAction(entry.clientId, dateISO);
        }
      } catch {
        setStatus(prev); // revert on failure
      }
    });
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={entry.clientName} size="sm" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/clients/${entry.clientId}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {entry.clientName}
        </Link>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Icon name={getModality(entry.modality).icon} size={12} />
          {entry.dayTitle}
          <span className="text-border">·</span>
          {entry.exerciseCount} {getModality(entry.modality).itemNoun.toLowerCase()}
          {entry.exerciseCount === 1 ? "" : "s"}
        </p>
      </div>

      <Badge tone={meta.tone}>
        {status === "done" && <Icon name="check" size={12} />}
        {status === "missed" && <Icon name="x" size={12} />}
        {meta.label}
      </Badge>

      <div className="flex shrink-0 items-center gap-1.5">
        {status === "done" ? (
          <ButtonLink href={logHref} variant="ghost" size="sm">
            View
          </ButtonLink>
        ) : (
          <ButtonLink href={logHref} variant="outline" size="sm">
            <Icon name="check" size={14} /> Log
          </ButtonLink>
        )}
        {status === "missed" ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => mark("pending")}>
            Undo
          </Button>
        ) : (
          status === "pending" && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => mark("missed")}>
              Missed
            </Button>
          )
        )}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TodaysSessions({
  sessions,
  events,
  dateISO,
}: {
  sessions: RosterEntry[];
  events: RosterEvent[];
  dateISO: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = {
    all: sessions.length,
    pending: sessions.filter((s) => s.status === "pending").length,
    done: sessions.filter((s) => s.status === "done").length,
    missed: sessions.filter((s) => s.status === "missed").length,
  };
  const shown = filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Expected" },
    { key: "done", label: "Showed up" },
    { key: "missed", label: "Missed" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-primary">
            <Icon name="dumbbell" size={18} />
          </span>
          Today&rsquo;s sessions
        </CardTitle>
        {sessions.length > 0 && (
          <Badge tone="info">
            {counts.done}/{counts.all} in
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>No plan sessions scheduled for today.</p>
            <p className="text-xs">
              Sessions appear automatically from each client&rsquo;s active workout plan — tag
              the plan days by weekday (Mon, Wed, Fri&hellip;) and they&rsquo;ll show up here.
            </p>
            <ButtonLink href="/schedule" variant="ghost" size="sm">
              Open week view <Icon name="chevronRight" size={14} />
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="mb-1 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilter(c.key)}
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors " +
                    (filter === c.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-ink-secondary hover:bg-border/60")
                  }
                >
                  {c.label} {counts[c.key] > 0 && <span className="opacity-70">{counts[c.key]}</span>}
                </button>
              ))}
            </div>
            <div className="divide-y divide-border">
              {shown.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">Nothing here.</p>
              ) : (
                shown.map((s) => <SessionRow key={s.clientId} entry={s} dateISO={dateISO} />)
              )}
            </div>
          </>
        )}

        {events.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon name="calendar" size={13} /> One-off events
            </p>
            <ul className="divide-y divide-border">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                    {formatTime(e.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {e.title ?? "Appointment"}
                    {e.clientName && (
                      <span className="text-muted-foreground"> · {e.clientName}</span>
                    )}
                  </span>
                  {e.location && (
                    <span className="shrink-0 truncate text-xs text-muted-foreground">
                      {e.location}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
