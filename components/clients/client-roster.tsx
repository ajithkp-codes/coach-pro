"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, DeleteButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { ageFromDob, timeAgo } from "@/lib/format";
import { deleteClientAction } from "@/app/(dashboard)/clients/actions";
import type { ClientBoardItem } from "@/lib/data/dashboard";
import type { ClientSource } from "@/lib/types";

/** One filter tab. The risk tabs show the coaching detail; All/Archived are plain lists. */
type Filter = "all" | "at_risk" | "watch" | "due_checkin" | "on_track" | "archived";
type Sort = "recent" | "name";

/** The risk tabs — the only ones that reveal risk badges + compliance bars. */
const RISK_FILTERS: Filter[] = ["at_risk", "watch", "due_checkin", "on_track"];

const RISK_BADGE: Record<
  ClientBoardItem["risk"]["tier"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  at_risk: { label: "At risk", tone: "danger" },
  watch: { label: "Watch", tone: "warning" },
  on_track: { label: "On track", tone: "success" },
};

/** Source chip — only Excel / AI are shown; a hand-typed "manual" client gets none. */
const SOURCE_META: Record<
  Exclude<ClientSource, "manual">,
  { label: string; icon: "file" | "sparkles"; tone: "neutral" | "info" }
> = {
  excel: { label: "Excel", icon: "file", tone: "neutral" },
  ai_import: { label: "AI", icon: "sparkles", tone: "info" },
};

function daysSince(dateISO: string | null): number | null {
  if (!dateISO) return null;
  return Math.round((Date.now() - new Date(`${dateISO}T00:00:00`).getTime()) / 86_400_000);
}

function isDueCheckin(b: ClientBoardItem): boolean {
  const d = daysSince(b.lastCheckIn);
  return d === null || d > 7;
}

/** A thin labelled compliance bar; null = no active plan for that dimension. */
function MiniBar({ label, pct }: { label: string; pct: number | null }) {
  const color =
    pct === null
      ? "bg-border"
      : pct >= 80
        ? "bg-success"
        : pct >= 50
          ? "bg-warning"
          : "bg-danger";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 text-[10px] font-semibold text-muted-foreground">{label}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className="w-7 text-[10px] tabular-nums text-muted-foreground">
        {pct === null ? "—" : `${pct}%`}
      </span>
    </div>
  );
}

/** Per-row delete — sits outside the row's navigation link so it never navigates. */
function RowDelete({ id, name }: { id: string; name: string }) {
  return (
    <Modal
      title={`Delete ${name}?`}
      description="This permanently removes the client and all their metrics, markers, and goals. This cannot be undone."
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label={`Delete ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-danger-bg hover:text-neg-text"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Open the client first and use <strong>Export</strong> if you need a copy of
            this data for their records.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <form action={deleteClientAction.bind(null, id)}>
              <DeleteButton label="Delete permanently" />
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ClientRoster({
  board,
  initialFilter,
}: {
  board: ClientBoardItem[];
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState<Filter>(() => {
    const valid: Filter[] = ["all", ...RISK_FILTERS, "archived"];
    return valid.includes(initialFilter as Filter) ? (initialFilter as Filter) : "all";
  });
  const [sort, setSort] = useState<Sort>("recent");

  const active = useMemo(() => board.filter((b) => b.status === "active"), [board]);
  const archived = useMemo(() => board.filter((b) => b.status === "archived"), [board]);

  const counts = useMemo(
    () => ({
      all: active.length,
      at_risk: active.filter((b) => b.risk.tier === "at_risk").length,
      watch: active.filter((b) => b.risk.tier === "watch").length,
      due_checkin: active.filter(isDueCheckin).length,
      on_track: active.filter((b) => b.risk.tier === "on_track").length,
      archived: archived.length,
    }),
    [active, archived],
  );

  const detailed = RISK_FILTERS.includes(filter);

  const shown = useMemo(() => {
    const pool =
      filter === "archived"
        ? archived
        : filter === "at_risk"
          ? active.filter((b) => b.risk.tier === "at_risk")
          : filter === "watch"
            ? active.filter((b) => b.risk.tier === "watch")
            : filter === "on_track"
              ? active.filter((b) => b.risk.tier === "on_track")
              : filter === "due_checkin"
                ? active.filter(isDueCheckin)
                : active;

    return [...pool].sort((a, b) =>
      sort === "name"
        ? a.full_name.localeCompare(b.full_name)
        : a.created_at < b.created_at
          ? 1
          : -1,
    );
  }, [active, archived, filter, sort]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "at_risk", label: "At risk", count: counts.at_risk },
    { key: "watch", label: "Watch", count: counts.watch },
    { key: "due_checkin", label: "Due check-in", count: counts.due_checkin },
    { key: "on_track", label: "On track", count: counts.on_track },
    { key: "archived", label: "Archived", count: counts.archived },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === chip.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {chip.label}
              <span className="tabular-nums opacity-70">{chip.count}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-border p-0.5 text-xs font-medium">
          {([
            { key: "recent", label: "Recently added" },
            { key: "name", label: "Name A–Z" },
          ] as const).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                sort === s.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No clients in this view.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
          {shown.map((c) => {
            const risk = RISK_BADGE[c.risk.tier];
            const age = ageFromDob(c.date_of_birth);
            const contact =
              [age !== null ? `${age} yrs` : null, c.phone, c.email]
                .filter(Boolean)
                .join(" · ") || "No contact details";
            const src = c.source === "manual" ? null : SOURCE_META[c.source];
            return (
              <li key={c.id} className="flex items-center">
                <Link
                  href={`/clients/${c.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <Avatar name={c.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{c.full_name}</span>
                      {detailed && c.risk.tier !== "on_track" && (
                        <Badge tone={risk.tone}>{risk.label}</Badge>
                      )}
                      {detailed && !c.consent_given && (
                        <Badge tone="warning">No consent</Badge>
                      )}
                      {c.status === "archived" && <Badge>Archived</Badge>}
                      {src && (
                        <Badge tone={src.tone} className="font-medium tracking-normal">
                          <Icon name={src.icon} size={11} />
                          {src.label}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {contact}
                      <span className="text-muted-foreground/70"> · Added {timeAgo(c.created_at)}</span>
                    </p>
                  </div>

                  {detailed && (
                    <>
                      <div className="hidden shrink-0 flex-col gap-1 sm:flex">
                        <MiniBar label="W" pct={c.compliance.workoutPct} />
                        <MiniBar label="N" pct={c.compliance.nutritionPct} />
                      </div>
                      <div className="flex w-12 shrink-0 flex-col items-end">
                        <span
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            c.compliance.workoutPct === null && c.compliance.nutritionPct === null
                              ? "text-muted-foreground"
                              : c.compliance.score >= 80
                                ? "text-success"
                                : c.compliance.score >= 50
                                  ? "text-warning"
                                  : "text-danger",
                          )}
                        >
                          {c.compliance.workoutPct === null && c.compliance.nutritionPct === null
                            ? "—"
                            : c.compliance.score}
                        </span>
                      </div>
                    </>
                  )}

                  <Icon name="chevronRight" size={14} className="shrink-0 text-muted-foreground" />
                </Link>
                <div className="pr-2">
                  <RowDelete id={c.id} name={c.full_name} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
