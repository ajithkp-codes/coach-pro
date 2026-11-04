"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { getModality, type Modality } from "@/lib/catalog/modalities";
import type { ClientTrainingSnapshot } from "@/lib/data/training-snapshot";
import {
  defaultBrief,
  GOAL_FOCUS_OPTIONS,
  EQUIPMENT_OPTIONS,
  SESSION_MINUTES_OPTIONS,
  EXPERIENCE_OPTIONS,
  INJURY_OPTIONS,
  CONDITION_OPTIONS,
  STYLE_OPTIONS,
  SPLIT_OPTIONS,
  type PlanBrief,
} from "@/lib/training/plan-brief";

/* ---------------------------------------------------------------- chip atoms */

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground"
      }`}
    >
      {selected && <Icon name="check" size={12} className="mr-1 inline text-primary" />}
      {label}
    </button>
  );
}

/** A labelled section with a number badge and one-line helper. */
function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          {step}
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="pl-7">{children}</div>
    </section>
  );
}

/** A collapsible advanced section (closed by default). */
function Collapsible({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[var(--radius)] border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span>
          <span className="text-sm font-medium">{title}</span>
          <span className="ml-2 text-xs text-muted-foreground">{hint}</span>
        </span>
        <Icon
          name="chevronRight"
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="flex flex-col gap-4 border-t border-border px-3 py-3">{children}</div>}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-primary)]"
      />
      {label}
    </label>
  );
}

/* ---------------------------------------------------------------- the brief */

/** Pre-select conditions we can infer from the client's flagged markers. */
function inferredConditions(snapshot: ClientTrainingSnapshot | null): string[] {
  if (!snapshot) return [];
  const out: string[] = [];
  const flagged = (needle: string) =>
    snapshot.flaggedMarkers.some((m) => m.label.toLowerCase().includes(needle));
  if (flagged("blood pressure")) out.push("High blood pressure");
  if (flagged("glucose") || flagged("hba1c")) out.push("Diabetes");
  return out;
}

export function AiPlanBrief({
  modality,
  snapshot,
  generating,
  error,
  onBack,
  onGenerate,
}: {
  modality: Modality;
  snapshot: ClientTrainingSnapshot | null;
  generating: boolean;
  error: string | null;
  onBack: () => void;
  onGenerate: (brief: PlanBrief) => void;
}) {
  const def = getModality(modality);
  const autoConditions = useMemo(() => inferredConditions(snapshot), [snapshot]);

  const [brief, setBrief] = useState<PlanBrief>(() => {
    const b = defaultBrief();
    const firstGoal = snapshot?.openGoals[0];
    if (firstGoal?.targetDate) b.deadline = firstGoal.targetDate;
    if (autoConditions.length) b.conditions = autoConditions;
    return b;
  });

  const set = <K extends keyof PlanBrief>(key: K, value: PlanBrief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));

  const toggleIn = (key: "goalFocus" | "equipment" | "injuries" | "conditions", value: string) =>
    setBrief((b) => {
      const list = b[key];
      return {
        ...b,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const applyGoal = (title: string, targetDate: string | null) =>
    setBrief((b) => ({
      ...b,
      goal: b.goal.trim() ? b.goal : title,
      deadline: targetDate ?? b.deadline,
    }));

  const noun = def.itemNoun.toLowerCase();

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          <Icon name="sparkles" size={16} className="text-primary" />
          <span className="font-medium">Generate with AI</span>
          <span className="text-muted-foreground">· {def.short}</span>
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Back
        </button>
      </div>

      {/* What we know — read-only snapshot from the client record */}
      {snapshot && (
        <div className="rounded-[var(--radius)] border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What we know about {snapshot.firstName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {[
              snapshot.age != null ? `${snapshot.age} yrs` : null,
              snapshot.sex && snapshot.sex !== "unspecified" ? snapshot.sex : null,
              snapshot.weightKg != null ? `${snapshot.weightKg} kg` : null,
            ]
              .filter(Boolean)
              .map((bit, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-border">·</span>}
                  {bit}
                </span>
              ))}
            {snapshot.age == null && snapshot.weightKg == null && (
              <span className="text-muted-foreground">
                No health data on file yet — fill the brief below.
              </span>
            )}
          </div>
          {snapshot.flaggedMarkers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {snapshot.flaggedMarkers.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger"
                >
                  <Icon name="alert" size={11} />
                  {m.label} {m.direction}
                </span>
              ))}
            </div>
          )}
          {snapshot.openGoals.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Open goals:</span>
              {snapshot.openGoals.map((g) => (
                <button
                  key={g.title}
                  type="button"
                  onClick={() => applyGoal(g.title, g.targetDate)}
                  className="rounded-full border border-border bg-background px-2 py-0.5 hover:border-primary hover:text-foreground"
                  title="Use as the plan goal"
                >
                  <Icon name="target" size={11} className="mr-1 inline text-primary" />
                  {g.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ① Goal & focus */}
      <Section step={1} title="Goal & focus" hint="What should this plan achieve?">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_FOCUS_OPTIONS.map((g) => (
            <Chip key={g} label={g} selected={brief.goalFocus.includes(g)} onClick={() => toggleIn("goalFocus", g)} />
          ))}
        </div>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            value={brief.goal}
            onChange={(e) => set("goal", e.target.value)}
            placeholder="In your words — e.g. drop body fat while keeping strength"
          />
          <Field label="Target date" htmlFor="ai-deadline">
            <Input
              id="ai-deadline"
              type="date"
              value={brief.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* ② Schedule & equipment */}
      <Section step={2} title="Schedule & equipment" hint="When they train and with what.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Days per week" htmlFor="ai-dpw">
            <Select
              id="ai-dpw"
              className="w-28"
              value={String(brief.daysPerWeek)}
              onChange={(e) => set("daysPerWeek", Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "day" : "days"}</option>
              ))}
            </Select>
          </Field>
          <Field label="Session length" htmlFor="ai-mins">
            <Select
              id="ai-mins"
              className="w-32"
              value={String(brief.sessionMinutes)}
              onChange={(e) => set("sessionMinutes", Number(e.target.value))}
            >
              {SESSION_MINUTES_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} min</option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="mb-1.5 mt-3 text-xs text-muted-foreground">Equipment available</p>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <Chip key={eq} label={eq} selected={brief.equipment.includes(eq)} onClick={() => toggleIn("equipment", eq)} />
          ))}
        </div>
      </Section>

      {/* ③ Experience */}
      <Section step={3} title="Experience" hint="How seasoned is the client?">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {EXPERIENCE_OPTIONS.map((x) => (
              <Chip
                key={x}
                label={x[0].toUpperCase() + x.slice(1)}
                selected={brief.experience === x}
                onClick={() => set("experience", x)}
              />
            ))}
          </div>
          <Toggle
            label="Returning after a break"
            checked={brief.returning}
            onChange={(v) => set("returning", v)}
          />
        </div>
      </Section>

      {/* ④ Health & injuries */}
      <Section step={4} title="Health & injuries" hint="The AI programs around these — safety first.">
        <p className="mb-1.5 text-xs text-muted-foreground">Injuries or movement limits</p>
        <div className="flex flex-wrap gap-1.5">
          {INJURY_OPTIONS.map((inj) => (
            <Chip key={inj} label={inj} selected={brief.injuries.includes(inj)} onClick={() => toggleIn("injuries", inj)} />
          ))}
        </div>
        <p className="mb-1.5 mt-3 text-xs text-muted-foreground">
          Medical conditions
          {autoConditions.length > 0 && (
            <span className="ml-1 text-primary">· added from health record</span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <Chip key={c} label={c} selected={brief.conditions.includes(c)} onClick={() => toggleIn("conditions", c)} />
          ))}
        </div>
        {(brief.injuries.length > 0 || brief.conditions.length > 0) && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Icon name="check" size={13} className="mt-0.5 shrink-0 text-primary" />
            The plan will avoid movements that aggravate what you selected.
          </p>
        )}
      </Section>

      {/* ⑤ Preferences (optional) */}
      <Collapsible title="Preferences" hint="Likes, dislikes, lifestyle — optional">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Enjoys / responds well to" htmlFor="ai-loves">
            <Input id="ai-loves" value={brief.loves} onChange={(e) => set("loves", e.target.value)} placeholder="e.g. kettlebells, outdoor cardio" />
          </Field>
          <Field label="Dislikes / can't do" htmlFor="ai-avoids">
            <Input id="ai-avoids" value={brief.avoids} onChange={(e) => set("avoids", e.target.value)} placeholder="e.g. running, burpees" />
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Preferred style</p>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_OPTIONS.map((s) => (
              <Chip key={s} label={s} selected={brief.style === s} onClick={() => set("style", brief.style === s ? "" : s)} />
            ))}
          </div>
        </div>
        <Field label="Lifestyle (job, sleep, stress, daily activity)" htmlFor="ai-lifestyle">
          <Input id="ai-lifestyle" value={brief.lifestyle} onChange={(e) => set("lifestyle", e.target.value)} placeholder="e.g. desk job, ~6h sleep, high stress, 4k steps/day" />
        </Field>
      </Collapsible>

      {/* ⑥ Coach controls (optional) */}
      <Collapsible title="Coach controls" hint="Split & structure — smart defaults applied">
        <Field label="Training split" htmlFor="ai-split">
          <Select id="ai-split" value={brief.split} onChange={(e) => set("split", e.target.value)}>
            {SPLIT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-col gap-2">
          <Toggle label="Build in week-to-week progression" checked={brief.progression} onChange={(v) => set("progression", v)} />
          <Toggle label={`Include a warm-up each session`} checked={brief.includeWarmup} onChange={(v) => set("includeWarmup", v)} />
          <Toggle label={`Include mobility work`} checked={brief.includeMobility} onChange={(v) => set("includeMobility", v)} />
          <Toggle label={`Include conditioning / cardio`} checked={brief.includeConditioning} onChange={(v) => set("includeConditioning", v)} />
        </div>
      </Collapsible>

      {/* Anything else */}
      <Field label="Anything else?" htmlFor="ai-notes">
        <Textarea
          id="ai-notes"
          value={brief.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={`Optional — anything else that should shape the ${noun}s or the week.`}
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={generating}>
          Back
        </Button>
        <Button type="button" onClick={() => onGenerate(brief)} disabled={generating}>
          <Icon name="sparkles" size={15} /> {generating ? "Generating…" : "Generate draft"}
        </Button>
      </div>
    </div>
  );
}
