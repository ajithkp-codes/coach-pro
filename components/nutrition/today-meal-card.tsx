"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { todayIntake } from "@/lib/nutrition-analytics";
import type { DietLogWithEntries, DietPlan } from "@/lib/types";

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
      <text x="28" y="28" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="13" fontWeight="700">
        {clamped}%
      </text>
    </svg>
  );
}

export function TodayMealCard({
  clientId,
  activePlan,
  logs,
}: {
  clientId: string;
  activePlan: DietPlan | null;
  logs: DietLogWithEntries[];
}) {
  if (!activePlan) return null;

  const today = todayIntake(logs);
  const calTarget = activePlan.target_calories;
  const proTarget = activePlan.target_protein_g;
  const calPct = calTarget ? Math.round((today.calories / calTarget) * 100) : null;

  const chips = [
    calTarget
      ? `${today.calories.toLocaleString("en-IN")} / ${calTarget.toLocaleString("en-IN")} kcal`
      : `${today.calories.toLocaleString("en-IN")} kcal`,
    proTarget ? `${today.protein} / ${proTarget} g protein` : `${today.protein} g protein`,
  ];

  return (
    <div className="bg-gradient-brand flex flex-col gap-4 rounded-[var(--radius)] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/75">
          <Icon name="utensils" size={13} /> Today
        </p>
        <p className="mt-1.5 text-lg font-bold">
          {today.logged ? "Logged so far today" : "Nothing logged yet today"}
        </p>
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
        {calPct != null && (
          <div className="flex items-center gap-2">
            <Ring pct={calPct} />
            <span className="text-xs leading-tight text-white/80">
              of calorie
              <br />
              target
            </span>
          </div>
        )}
        <Link
          href={`/clients/${clientId}/nutrition/log`}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02]"
        >
          <Icon name="plus" size={15} /> Log today
        </Link>
      </div>
    </div>
  );
}
