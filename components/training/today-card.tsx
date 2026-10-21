"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { daySummary, weekProgress, nextScheduledDay } from "@/lib/training-analytics";
import type { WorkoutPlan, WorkoutSessionWithSets } from "@/lib/types";

function Ring({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped / 100)}
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
      >
        {clamped}%
      </text>
    </svg>
  );
}

export function TodayCard({
  clientId,
  plans,
  sessions,
}: {
  clientId: string;
  plans: WorkoutPlan[];
  sessions: WorkoutSessionWithSets[];
}) {
  const next = nextScheduledDay(plans, sessions);
  if (!next) return null;

  const progress = weekProgress(sessions, plans);
  const s = daySummary(next.day);
  const chips = [
    s.focus.length ? s.focus.join(" · ") : "Mixed",
    `${s.exercises} exercise${s.exercises === 1 ? "" : "s"}`,
    `~${s.minutes} min`,
  ];

  return (
    <div className="bg-gradient-brand flex flex-col gap-4 rounded-[var(--radius)] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/75">
          <Icon name="sparkles" size={13} /> Up next
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold">
            {next.day.day}
          </span>
          {next.day.title && <span className="text-lg font-bold">{next.day.title}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-white/85">
          {chips.map((chip, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/40">·</span>}
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {progress && (
          <div className="flex items-center gap-2">
            <Ring pct={progress.pct} />
            <span className="text-xs leading-tight text-white/80">
              {progress.done} of {progress.target}
              <br />
              this week
            </span>
          </div>
        )}
        <Link
          href={`/clients/${clientId}/training/log?plan=${next.planId}&day=${next.dayIndex}`}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
        >
          <Icon name="dumbbell" size={15} /> Log this day
        </Link>
      </div>
    </div>
  );
}
