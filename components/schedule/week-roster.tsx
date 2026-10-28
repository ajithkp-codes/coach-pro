"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { markMissedAction, clearMissedAction } from "@/app/(dashboard)/schedule/actions";
import type { DayRoster, RosterEntry, RosterStatus } from "@/lib/data/roster";

function dayHeading(dayISO: string, todayISO: string): { title: string; sub: string } {
  const d = new Date(`${dayISO}T00:00:00`);
  const diff = Math.round(
    (d.getTime() - new Date(`${todayISO}T00:00:00`).getTime()) / 86_400_000,
  );
  const sub = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (diff === 0) return { title: "Today", sub };
  if (diff === 1) return { title: "Tomorrow", sub };
  return { title: d.toLocaleDateString("en-IN", { weekday: "long" }), sub };
}

function SessionRow({ entry, dateISO }: { entry: RosterEntry; dateISO: string }) {
  const [status, setStatus] = useState<RosterStatus>(entry.status);
  const [pending, startTransition] = useTransition();
  const logHref = `/clients/${entry.clientId}/training/log?plan=${entry.planId}&day=${entry.dayIndex}`;

  const mark = (next: RosterStatus) => {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        if (next === "missed") await markMissedAction(entry.clientId, dateISO, entry.dayTitle);
        else await clearMissedAction(entry.clientId, dateISO);
      } catch {
        setStatus(prev);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <span
        className={
          "h-1.5 w-1.5 shrink-0 rounded-full " +
          (status === "done"
            ? "bg-success"
            : status === "missed"
              ? "bg-danger"
              : "bg-border")
        }
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/clients/${entry.clientId}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {entry.clientName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{entry.dayTitle}</p>
      </div>
      {status === "done" && (
        <Badge tone="success">
          <Icon name="check" size={12} /> In
        </Badge>
      )}
      {status === "missed" && (
        <Badge tone="danger">
          <Icon name="x" size={12} /> Missed
        </Badge>
      )}
      <div className="flex shrink-0 items-center gap-1">
        <ButtonLink href={logHref} variant="outline" size="sm">
          {status === "done" ? "View" : "Log"}
        </ButtonLink>
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
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function WeekRoster({ week, todayISO }: { week: DayRoster[]; todayISO: string }) {
  return (
    <div className="flex flex-col gap-4">
      {week.map((day) => {
        const { title, sub } = dayHeading(day.dateISO, todayISO);
        const empty = day.sessions.length === 0 && day.events.length === 0;
        const done = day.sessions.filter((s) => s.status === "done").length;
        return (
          <Card key={day.dateISO} className={day.dateISO === todayISO ? "border-primary/40" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-baseline gap-2">
                {title}
                <span className="text-xs font-normal text-muted-foreground">{sub}</span>
              </CardTitle>
              {day.sessions.length > 0 && (
                <Badge tone={day.dateISO === todayISO ? "info" : "neutral"}>
                  {done}/{day.sessions.length}
                </Badge>
              )}
            </CardHeader>
            <CardBody>
              {empty ? (
                <p className="text-sm text-muted-foreground">Rest day — nothing scheduled.</p>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {day.sessions.map((s) => (
                      <SessionRow key={s.clientId} entry={s} dateISO={day.dateISO} />
                    ))}
                  </div>
                  {day.events.length > 0 && (
                    <ul className="mt-2 divide-y divide-border border-t border-border pt-1">
                      {day.events.map((e) => (
                        <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
                          <Icon name="calendar" size={13} />
                          <span className="w-14 shrink-0 text-xs text-muted-foreground">
                            {formatTime(e.startsAt)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {e.title ?? "Appointment"}
                            {e.clientName && (
                              <span className="text-muted-foreground"> · {e.clientName}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
