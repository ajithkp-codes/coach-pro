"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { ClientTrainingSnapshot } from "@/lib/data/training-snapshot";
import {
  defaultDietBrief,
  GOAL_FOCUS_OPTIONS,
  MACRO_APPROACH_OPTIONS,
  MEALS_PER_DAY_OPTIONS,
  DIETARY_PATTERN_OPTIONS,
  CUISINE_OPTIONS,
  ALLERGY_OPTIONS,
  CONDITION_OPTIONS,
  ACTIVITY_OPTIONS,
  COOKING_TIME_OPTIONS,
  BUDGET_OPTIONS,
  DAY_STRUCTURE_OPTIONS,
  type DietBrief,
} from "@/lib/nutrition/diet-brief";

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
  if (flagged("glucose") || flagged("hba1c")) out.push("Diabetes");
  if (flagged("blood pressure")) out.push("High blood pressure");
  if (flagged("cholesterol") || flagged("ldl") || flagged("triglyceride")) out.push("High cholesterol");
  if (flagged("tsh") || flagged("thyroid")) out.push("Thyroid");
  return out;
}

export function AiDietBrief({
  snapshot,
  generating,
  error,
  onBack,
  onGenerate,
}: {
  snapshot: ClientTrainingSnapshot | null;
  generating: boolean;
  error: string | null;
  onBack: () => void;
  onGenerate: (brief: DietBrief) => void;
}) {
  const autoConditions = useMemo(() => inferredConditions(snapshot), [snapshot]);

  const [brief, setBrief] = useState<DietBrief>(() => {
    const b = defaultDietBrief();
    const firstGoal = snapshot?.openGoals[0];
    if (firstGoal?.targetDate) b.deadline = firstGoal.targetDate;
    if (autoConditions.length) b.conditions = autoConditions;
    return b;
  });

  const set = <K extends keyof DietBrief>(key: K, value: DietBrief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));

  const toggleIn = (key: "goalFocus" | "cuisines" | "allergies" | "conditions", value: string) =>
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

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          <Icon name="sparkles" size={16} className="text-primary" />
          <span className="font-medium">Generate with AI</span>
          <span className="text-muted-foreground">· meal plan</span>
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
              snapshot.heightCm != null ? `${snapshot.heightCm} cm` : null,
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
                No health data on file yet. Fill in the brief below.
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

      {/* ① Goal & target */}
      <Section step={1} title="Goal & target" hint="What should this plan achieve?">
        <div className="flex flex-wrap gap-1.5">
          {GOAL_FOCUS_OPTIONS.map((g) => (
            <Chip key={g} label={g} selected={brief.goalFocus.includes(g)} onClick={() => toggleIn("goalFocus", g)} />
          ))}
        </div>
        <Input
          className="mt-2.5"
          value={brief.goal}
          onChange={(e) => set("goal", e.target.value)}
          placeholder="In your words, e.g. drop fat while keeping muscle on a vegetarian diet"
        />
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Target weight" htmlFor="ai-target-weight" hint="kg, optional">
            <Input
              id="ai-target-weight"
              className="w-28"
              inputMode="decimal"
              value={brief.targetWeightKg}
              onChange={(e) => set("targetWeightKg", e.target.value)}
              placeholder="e.g. 68"
            />
          </Field>
          <Field label="Target date" htmlFor="ai-deadline" hint="optional">
            <Input
              id="ai-deadline"
              type="date"
              value={brief.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* ② Targets */}
      <Section step={2} title="Daily targets" hint="Leave blank and AI estimates from the client picture.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Calories" htmlFor="ai-cals" hint="kcal/day, optional">
            <Input
              id="ai-cals"
              className="w-28"
              inputMode="numeric"
              value={brief.calories}
              onChange={(e) => set("calories", e.target.value)}
              placeholder="e.g. 1800"
            />
          </Field>
          <Field label="Protein" htmlFor="ai-protein" hint="g/day, optional">
            <Input
              id="ai-protein"
              className="w-28"
              inputMode="numeric"
              value={brief.protein}
              onChange={(e) => set("protein", e.target.value)}
              placeholder="e.g. 140"
            />
          </Field>
          <Field label="Macro approach" htmlFor="ai-macro">
            <Select
              id="ai-macro"
              className="w-44"
              value={brief.macroApproach}
              onChange={(e) => set("macroApproach", e.target.value)}
            >
              {MACRO_APPROACH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      {/* ③ How they eat */}
      <Section step={3} title="How they eat" hint="Pattern, cuisine and meal count shape every day.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Dietary pattern" htmlFor="ai-pattern">
            <Select
              id="ai-pattern"
              className="w-48"
              value={brief.dietaryPattern}
              onChange={(e) => set("dietaryPattern", e.target.value)}
            >
              {DIETARY_PATTERN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Meals per day" htmlFor="ai-meals">
            <Select
              id="ai-meals"
              className="w-28"
              value={String(brief.mealsPerDay)}
              onChange={(e) => set("mealsPerDay", Number(e.target.value))}
            >
              {MEALS_PER_DAY_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} meals</option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="mb-1.5 mt-3 text-xs text-muted-foreground">Cuisine preference</p>
        <div className="flex flex-wrap gap-1.5">
          {CUISINE_OPTIONS.map((c) => (
            <Chip key={c} label={c} selected={brief.cuisines.includes(c)} onClick={() => toggleIn("cuisines", c)} />
          ))}
        </div>
      </Section>

      {/* ④ Allergies & medical — safety first */}
      <Section step={4} title="Allergies & medical" hint="The AI strictly excludes and programs around these.">
        <p className="mb-1.5 text-xs text-muted-foreground">Allergies / intolerances</p>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGY_OPTIONS.map((a) => (
            <Chip key={a} label={a} selected={brief.allergies.includes(a)} onClick={() => toggleIn("allergies", a)} />
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
        {(brief.allergies.length > 0 || brief.conditions.length > 0) && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Icon name="check" size={13} className="mt-0.5 shrink-0 text-primary" />
            The plan will exclude your allergens and respect each condition.
          </p>
        )}
      </Section>

      {/* ⑤ Preferences (optional) */}
      <Collapsible title="Preferences" hint="Likes, dislikes, activity (optional)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Foods they love" htmlFor="ai-likes">
            <Input id="ai-likes" value={brief.likes} onChange={(e) => set("likes", e.target.value)} placeholder="e.g. paneer, oats, chicken, bananas" />
          </Field>
          <Field label="Foods to avoid" htmlFor="ai-dislikes">
            <Input id="ai-dislikes" value={brief.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="e.g. mushrooms, fish, bitter gourd" />
          </Field>
        </div>
        <Field label="Activity level" htmlFor="ai-activity">
          <Select id="ai-activity" value={brief.activity} onChange={(e) => set("activity", e.target.value as DietBrief["activity"])}>
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </Collapsible>

      {/* ⑥ Coach controls (optional) */}
      <Collapsible title="Coach controls" hint="Cooking, budget, structure, smart defaults applied">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cooking time" htmlFor="ai-cooking">
            <Select id="ai-cooking" value={brief.cookingTime} onChange={(e) => set("cookingTime", e.target.value)}>
              {COOKING_TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Budget" htmlFor="ai-budget">
            <Select id="ai-budget" value={brief.budget} onChange={(e) => set("budget", e.target.value)}>
              {BUDGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Plan covers" htmlFor="ai-days">
          <Select id="ai-days" value={brief.dayStructure} onChange={(e) => set("dayStructure", e.target.value)}>
            {DAY_STRUCTURE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-col gap-2">
          <Toggle label="Suggest supplements where useful" checked={brief.includeSupplements} onChange={(v) => set("includeSupplements", v)} />
          <Toggle label="Add a daily water target" checked={brief.includeHydration} onChange={(v) => set("includeHydration", v)} />
          <Toggle label="Favour meal-prep-friendly meals" checked={brief.mealPrep} onChange={(v) => set("mealPrep", v)} />
        </div>
      </Collapsible>

      {/* Anything else */}
      <Field label="Anything else?" htmlFor="ai-notes">
        <Textarea
          id="ai-notes"
          value={brief.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional. Work schedule, eating out, fasting windows, anything else that shapes the meals."
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
