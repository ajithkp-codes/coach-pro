"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { ClientBoardItem } from "@/lib/data/dashboard";

type Filter = "all" | "at_risk" | "watch" | "due_checkin" | "on_track";

const RISK_BADGE: Record<
  ClientBoardItem["risk"]["tier"],
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  at_risk: { label: "At risk", tone: "danger" },
  watch: { label: "Watch", tone: "warning" },
  on_track: { label: "On track", tone: "success" },
};

function daysSince(dateISO: string | null): number | null {
  if (!dateISO) return null;
  return Math.round((Date.now() - new Date(`${dateISO}T00:00:00`).getTime()) / 86_400_000);
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

export function ClientHealthBoard({ board }: { board: ClientBoardItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c = { all: board.length, at_risk: 0, watch: 0, due_checkin: 0, on_track: 0 };
    for (const b of board) {
      if (b.risk.tier === "at_risk") c.at_risk++;
      if (b.risk.tier === "watch") c.watch++;
      if (b.risk.tier === "on_track") c.on_track++;
      const d = daysSince(b.lastCheckIn);
      if (d === null || d > 7) c.due_checkin++;
    }
    return c;
  }, [board]);

  const shown = useMemo(() => {
    return board.filter((b) => {
      switch (filter) {
        case "at_risk":
          return b.risk.tier === "at_risk";
        case "watch":
          return b.risk.tier === "watch";
        case "on_track":
          return b.risk.tier === "on_track";
        case "due_checkin": {
          const d = daysSince(b.lastCheckIn);
          return d === null || d > 7;
        }
        default:
          return true;
      }
    });
  }, [board, filter]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "at_risk", label: "At risk", count: counts.at_risk },
    { key: "watch", label: "Watch", count: counts.watch },
    { key: "due_checkin", label: "Due check-in", count: counts.due_checkin },
    { key: "on_track", label: "On track", count: counts.on_track },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
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

      {shown.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No clients in this view.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
          {shown.map((c) => {
            const risk = RISK_BADGE[c.risk.tier];
            const topReason = c.risk.reasons[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <Avatar name={c.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{c.full_name}</span>
                      {c.risk.tier !== "on_track" && <Badge tone={risk.tone}>{risk.label}</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {topReason ? topReason : `Active ${timeAgo(c.lastActivity)}`}
                    </p>
                  </div>

                  <div className="hidden shrink-0 flex-col gap-1 sm:flex">
                    <MiniBar label="W" pct={c.compliance.workoutPct} />
                    <MiniBar label="N" pct={c.compliance.nutritionPct} />
                  </div>

                  <div className="w-12 shrink-0 text-right">
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
                    <Icon name="chevronRight" size={14} className="ml-auto mt-0.5 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
