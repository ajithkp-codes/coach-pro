"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { searchMovements } from "@/lib/catalog/movements";
import {
  getModality,
  type Modality,
  type LogField,
  type ModalityDef,
} from "@/lib/catalog/modalities";
import { todayISO, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/training/actions";
import type { WorkoutSessionWithSets, WorkoutPlan, PlanItem } from "@/lib/types";
import type { LastExercise, LastSet } from "@/lib/data/training";

/** A set's values keyed by log-field key (strings while editing). */
type SetValues = Record<string, string>;
interface SetRow { values: SetValues; done: boolean }
/** `planned` = prescribed by the trainer's plan day; false = added by the client
 *  off-plan (shown with an "Extra" tag when the session is tied to a plan). */
interface Block {
  id: string;
  name: string;
  sets: SetRow[];
  planned: boolean;
  /** The trainer's prescription for this item, kept visible while actuals are logged. */
  target?: string;
}

let uid = 0;
const newId = () => `b${Date.now()}_${uid++}`;
const emptySet = (): SetRow => ({ values: {}, done: false });

const leadingNumber = (s: string | undefined) => {
  const m = (s ?? "").match(/-?\d+(\.\d+)?/);
  return m ? m[0] : "";
};
const setCount = (s: string | undefined) => {
  const n = parseInt(leadingNumber(s || "1"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : 1;
};

/** Reconstruct editable values from a stored set — columns first, then metrics. */
function valuesFromSet(s: WorkoutSessionWithSets["sets"][number]): SetValues {
  const v: SetValues = {};
  if (s.weight_kg != null) v.weight = String(s.weight_kg);
  if (s.reps != null) v.reps = String(s.reps);
  if (s.rpe != null) v.rpe = String(s.rpe);
  if (s.duration_sec != null) v.duration = String(s.duration_sec);
  if (s.distance_m != null) v.distance = String(s.distance_m);
  for (const [k, raw] of Object.entries(s.metrics ?? {})) {
    if (raw != null && raw !== "") v[k] = String(raw);
  }
  return v;
}

function blocksFromSession(session: WorkoutSessionWithSets): Block[] {
  const blocks: Block[] = [];
  for (const s of session.sets) {
    const row: SetRow = { values: valuesFromSet(s), done: false };
    const last = blocks[blocks.length - 1];
    if (last && last.name === s.exercise_name) last.sets.push(row);
    else blocks.push({ id: newId(), name: s.exercise_name, sets: [row], planned: true });
  }
  return blocks;
}

/** Seed editable values for one plan item, limited to the modality's log fields. */
function valuesFromPlanItem(it: PlanItem, fields: LogField[]): SetValues {
  const numericReps = /^\s*\d+\s*$/.test(it.reps ?? "") ? (it.reps ?? "").trim() : "";
  const src: Record<string, string> = {
    reps: numericReps,
    weight: leadingNumber(it.weight),
    duration: leadingNumber(it.duration),
    distance: leadingNumber(it.distance),
    rounds: leadingNumber(it.rounds),
    tempo: it.tempo ?? "",
  };
  const v: SetValues = {};
  for (const f of fields) if (src[f.key]) v[f.key] = src[f.key];
  return v;
}

/** A one-line human summary of what the trainer prescribed, built generically from
 *  the modality's plan columns — so it reads right for every stream (e.g. strength
 *  "Sets 3 · Reps 8-12 · Weight 60kg", running "Reps 6 · Distance / Time 8 km · Target 5K pace"). */
function prescribedSummary(it: PlanItem, def: ModalityDef): string {
  const fields = it as unknown as Record<string, string | undefined>;
  const parts = def.planColumns
    .map((c) => {
      const v = (fields[c.field] ?? "").trim();
      return v ? `${c.label} ${v}` : null;
    })
    .filter((p): p is string => p !== null);
  return parts.join(" · ");
}

function blocksFromPlanDay(items: PlanItem[], def: ModalityDef, planned = true): Block[] {
  return items.map((it) => {
    const base = valuesFromPlanItem(it, def.logFields);
    return {
      id: newId(),
      name: it.exercise_name,
      planned,
      target: prescribedSummary(it, def) || undefined,
      sets: Array.from({ length: setCount(it.sets) }, () => ({ values: { ...base }, done: false })),
    };
  });
}

/** The unit a modality logs a metric in (e.g. running distance in "km", not "m"). */
function unitFor(def: ModalityDef, key: "distance" | "duration", fallback: string): string {
  return def.logFields.find((f) => f.key === key)?.unit ?? fallback;
}

/** One previous set rendered for the metric this modality tracks. */
function formatLastSet(s: LastSet, def: ModalityDef): string {
  const n = (v: number | null) => (v != null ? formatNumber(v) : "-");
  switch (def.primaryMetric) {
    case "weight":
      return `${n(s.weight_kg)}×${n(s.reps)}`;
    case "reps":
      return s.weight_kg != null ? `${n(s.weight_kg)}×${n(s.reps)}` : `${n(s.reps)}`;
    case "duration":
      return `${n(s.duration_sec)}${unitFor(def, "duration", "s")}`;
    case "distance":
      return `${n(s.distance_m)}${unitFor(def, "distance", "m")}`;
  }
}
const lastLabel = (last: LastExercise, def: ModalityDef) =>
  last.sets.map((s) => formatLastSet(s, def)).join(", ");

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 flex-1 text-base">
      {pending ? "Saving…" : "Finish workout"}
    </Button>
  );
}

/** One field's input, driven by the modality's LogField definition. */
function FieldInput({
  field,
  value,
  onChange,
  big,
}: {
  field: LogField;
  value: string;
  onChange: (v: string) => void;
  big?: boolean;
}) {
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;
  const h = big ? "h-14 text-lg" : "h-11";
  const w = big ? "w-24" : "w-20";
  return (
    <label className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 px-0.5 text-[11px] font-medium text-muted-foreground">
        {label}
        {field.hint && (
          <span
            tabIndex={0}
            role="img"
            aria-label={field.hint}
            title={field.hint}
            className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-current text-[9px] font-semibold leading-none"
          >
            i
          </span>
        )}
      </span>
      {field.input === "select" ? (
        <Select className={cn(h, "w-24 text-center")} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">–</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      ) : (
        <Input
          className={cn(h, w, "text-center")}
          type={field.input === "number" ? "number" : "text"}
          inputMode={field.input === "number" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function WorkoutLogger({
  clientId,
  action,
  modality,
  session,
  plans = [],
  lastByExercise,
  prefill,
  prefillPlanId,
  prefillPlanDay,
  prefillWeek,
}: {
  clientId: string;
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  modality: Modality;
  session?: WorkoutSessionWithSets;
  plans?: WorkoutPlan[];
  lastByExercise: Record<string, LastExercise>;
  prefill?: PlanItem[];
  prefillPlanId?: string;
  prefillPlanDay?: string;
  prefillWeek?: number;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});

  const def = getModality(modality);
  const logFields = def.logFields;
  const noun = def.itemNoun.toLowerCase();

  const [performedOn, setPerformedOn] = useState(session?.performed_on ?? todayISO());
  const [title, setTitle] = useState(session?.title ?? "");
  const [duration, setDuration] = useState(
    session?.duration_min != null ? String(session.duration_min) : "",
  );
  const [blocks, setBlocks] = useState<Block[]>(
    session ? blocksFromSession(session) : prefill ? blocksFromPlanDay(prefill, def) : [],
  );

  // Plan link: which plan day this session fulfils, so the log follows the plan.
  const [planId, setPlanId] = useState<string | null>(session?.plan_id ?? prefillPlanId ?? null);
  const [planDay, setPlanDay] = useState<string | null>(session?.plan_day ?? prefillPlanDay ?? null);
  const [weekNumber, setWeekNumber] = useState<number>(
    session?.week_number ?? prefillWeek ?? 1,
  );
  const linkedPlan = planId ? plans.find((p) => p.id === planId) ?? null : null;

  /** Load a plan day's prescribed items as the session, tagging the plan link. */
  function loadPlanDay(plan: WorkoutPlan, dayIdx: number, week: number) {
    const day = plan.days[dayIdx];
    if (!day) return;
    setBlocks(blocksFromPlanDay(day.items, def, true));
    setPlanId(plan.id);
    setPlanDay(day.day + (day.title ? ` · ${day.title}` : ""));
    setWeekNumber(week);
    if (!title.trim()) setTitle(day.title || day.day);
  }

  // In-gym focus mode: one exercise at a time with a big rest timer.
  const [focus, setFocus] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  useEffect(() => {
    if (focus && blocks.length === 0) setFocus(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [focus, blocks.length]);

  // Rest timer
  const [rest, setRest] = useState<{ total: number; left: number } | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!rest) return;
    restRef.current = setInterval(() => {
      setRest((r) => {
        if (!r) return r;
        if (r.left <= 1) return null;
        return { ...r, left: r.left - 1 };
      });
    }, 1000);
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, [rest !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent double-submission: lock after first submit, unlock only on error.
  const submittedRef = useRef(false);
  useEffect(() => {
    if (state.error) submittedRef.current = false;
  }, [state.error]);

  // Navigate away after a successful save (celebration shown first if PRs).
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!state.ok) return;
    if (state.prs && state.prs.length > 0)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCelebrating(true);
    else router.push(`/clients/${clientId}/training`);
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  function startRest(seconds = 90) {
    setRest({ total: seconds, left: seconds });
  }

  // ---- block/set mutations ----
  const addBlock = (name: string) =>
    // Off-plan when a plan is linked, so deviations are visible to the trainer.
    setBlocks((b) => [...b, { id: newId(), name, sets: [emptySet()], planned: planId == null }]);
  const removeBlock = (id: string) => setBlocks((b) => b.filter((x) => x.id !== id));
  const addSet = (id: string) =>
    setBlocks((b) =>
      b.map((x) =>
        x.id === id
          ? { ...x, sets: [...x.sets, { values: { ...(x.sets[x.sets.length - 1]?.values ?? {}) }, done: false }] }
          : x,
      ),
    );
  const removeSet = (id: string, i: number) =>
    setBlocks((b) =>
      b.map((x) => (x.id === id ? { ...x, sets: x.sets.length === 1 ? [emptySet()] : x.sets.filter((_, j) => j !== i) } : x)),
    );
  const updateValue = (id: string, i: number, key: string, value: string) =>
    setBlocks((b) =>
      b.map((x) =>
        x.id === id
          ? { ...x, sets: x.sets.map((s, j) => (j === i ? { ...s, values: { ...s.values, [key]: value } } : s)) }
          : x,
      ),
    );
  const toggleDone = (id: string, i: number) =>
    setBlocks((b) =>
      b.map((x) =>
        x.id === id
          ? {
              ...x,
              sets: x.sets.map((s, j) => {
                if (j !== i) return s;
                const done = !s.done;
                if (done) startRest();
                return { ...s, done };
              }),
            }
          : x,
      ),
    );

  const setHasValue = (s: SetRow) => logFields.some((f) => s.values[f.key]?.trim());

  // Serialize to the flat sets payload: mapped columns + a metrics bag for the rest.
  const setsJson = useMemo(() => {
    const flat: Record<string, unknown>[] = [];
    for (const blk of blocks) {
      if (!blk.name.trim()) continue;
      for (const s of blk.sets) {
        if (!setHasValue(s)) continue; // skip truly empty sets
        const payload: Record<string, unknown> = { exercise_name: blk.name };
        const metrics: Record<string, string | number> = {};
        for (const f of logFields) {
          const raw = (s.values[f.key] ?? "").trim();
          if (!raw) continue;
          if (f.column) payload[f.column] = raw; // server coerces numeric columns
          else metrics[f.key] = f.input === "number" ? Number(raw) : raw;
        }
        payload.metrics = metrics;
        flat.push(payload);
      }
    }
    return JSON.stringify(flat);
  }, [blocks, logFields]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSets = blocks.reduce((n, b) => n + b.sets.filter(setHasValue).length, 0);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (submittedRef.current) { e.preventDefault(); return; }
        submittedRef.current = true;
      }}
      className="flex flex-col gap-4 pb-28"
    >
      <input type="hidden" name="performed_on" value={performedOn} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="duration_min" value={duration} />
      <input type="hidden" name="modality" value={modality} />
      <input type="hidden" name="plan_id" value={planId ?? ""} />
      <input type="hidden" name="plan_day" value={planDay ?? ""} />
      <input type="hidden" name="week_number" value={planId ? weekNumber : ""} />
      <input type="hidden" name="sets" value={setsJson} />

      {/* Session meta */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Date</span>
          <Input type="date" max={todayISO()} value={performedOn} onChange={(e) => setPerformedOn(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 col-span-1">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Upper body" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Minutes</span>
          <Input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
      </div>

      {/* Plan link — this session follows a prescribed plan day. */}
      {linkedPlan && planDay && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-primary/40 bg-primary/5 px-3 py-2">
          <p className="flex items-center gap-1.5 text-sm">
            <Icon name="dumbbell" size={15} className="text-primary" />
            <span className="font-medium">{linkedPlan.name}</span>
            <span className="text-muted-foreground">· {planDay}</span>
          </p>
          <div className="flex items-center gap-2">
            {linkedPlan.duration_weeks > 1 && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Week
                <Select
                  className="h-8 w-16"
                  value={String(weekNumber)}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                >
                  {Array.from({ length: linkedPlan.duration_weeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </Select>
              </label>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setPlanId(null); setPlanDay(null); }}
            >
              Unlink
            </Button>
          </div>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {def.short}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setFocusIdx(0); setFocus(true); }}
          >
            <Icon name="target" size={15} /> Focus mode
          </Button>
        </div>
      )}

      {/* Exercise blocks */}
      {blocks.map((blk) => {
        const last = lastByExercise[blk.name.toLowerCase()];
        return (
          <div key={blk.id} className="rounded-[var(--radius)] border border-border bg-card p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-semibold text-primary">
                {blk.name}
                {planId && !blk.planned && (
                  <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    Extra
                  </span>
                )}
              </p>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${noun}`} onClick={() => removeBlock(blk.id)}>
                <Icon name="x" size={16} />
              </Button>
            </div>
            {blk.target && (
              <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                <Icon name="target" size={13} className="mt-0.5 shrink-0 text-primary/70" />
                <span>
                  <span className="font-medium text-foreground/80">Prescribed:</span> {blk.target}
                </span>
              </p>
            )}
            {last && (
              <p className="mt-0.5 text-xs text-muted-foreground">Last: {lastLabel(last, def)}</p>
            )}

            <div className="mt-2 flex flex-col gap-1.5">
              {blk.sets.map((s, i) => (
                <div key={i} className={cn("flex flex-wrap items-end gap-2 rounded-lg px-1 py-1", s.done && "bg-success-bg")}>
                  <span className="w-6 pb-2.5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  {logFields.map((f) => (
                    <FieldInput key={f.key} field={f} value={s.values[f.key] ?? ""} onChange={(v) => updateValue(blk.id, i, f.key, v)} />
                  ))}
                  <div className="flex items-center gap-2 pb-0.5">
                    <button
                      type="button"
                      aria-label={s.done ? "Mark set not done" : "Mark set done"}
                      onClick={() => toggleDone(blk.id, i)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        s.done ? "border-success bg-success text-white" : "border-input text-muted-foreground hover:border-success",
                      )}
                    >
                      <Icon name="check" size={16} strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove set"
                      onClick={() => removeSet(blk.id, i)}
                      className="shrink-0 text-muted-foreground hover:text-danger"
                    >
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addSet(blk.id)}>
                <Icon name="plus" size={14} /> Add set
              </Button>
            </div>
          </div>
        );
      })}

      {/* Plan-first: when nothing is logged yet and the client has a plan, start
          from the prescribed day. Off-plan logging stays available below. */}
      {blocks.length === 0 && plans.length > 0 && (
        <PlanStart plans={plans} onPick={(p, i) => loadPlanDay(p, i, 1)} />
      )}

      {/* Add exercise / from plan */}
      <div className="flex flex-wrap gap-2">
        <AddExercise modality={modality} noun={def.itemNoun} onPick={addBlock} planLinked={planId != null} />
        {plans.length > 0 && (
          <AddFromPlan plans={plans} onLoad={(items) => setBlocks((b) => [...b, ...blocksFromPlanDay(items, def)])} />
        )}
      </div>

      {blocks.length === 0 && plans.length === 0 && (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Add {noun === "exercise" ? "an exercise" : `a ${noun}`} to start logging. Create a plan for this client to log against a prescribed day.
        </p>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      {/* In-gym focus mode overlay */}
      {focus && blocks.length > 0 && (() => {
        const fi = Math.min(focusIdx, blocks.length - 1);
        const fb = blocks[fi];
        const last = lastByExercise[fb.name.toLowerCase()];
        const isLast = fi === blocks.length - 1;
        return (
          <div className="fixed inset-0 z-40 flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                {def.itemNoun} {fi + 1} of {blocks.length}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFocus(false)}>
                <Icon name="x" size={16} /> Exit focus
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="mx-auto flex w-full max-w-md flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{fb.name}</h2>
                  {fb.target && (
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Icon name="target" size={15} className="mt-0.5 shrink-0 text-primary/70" />
                      <span>
                        <span className="font-medium text-foreground/80">Prescribed:</span> {fb.target}
                      </span>
                    </p>
                  )}
                  {last && (
                    <p className="mt-1 text-sm text-muted-foreground">Last: {lastLabel(last, def)}</p>
                  )}
                </div>

                {/* Big rest timer */}
                <div className="rounded-[var(--radius)] border border-border p-4">
                  {rest ? (
                    <div className="flex flex-col items-center gap-3">
                      <span className="font-mono text-5xl font-bold tabular-nums text-primary">
                        {Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, "0")}
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(rest.left / rest.total) * 100}%` }} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setRest((r) => (r ? { ...r, left: r.left + 15 } : r))}>+15s</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setRest(null)}>Skip rest</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      Tap <Icon name="check" size={13} className="inline align-text-bottom" /> on a set to start a 90s rest.
                    </p>
                  )}
                </div>

                {/* Set rows — large touch targets, same handlers as the list view */}
                <div className="flex flex-col gap-2">
                  {fb.sets.map((s, i) => (
                    <div key={i} className={cn("flex flex-wrap items-end gap-2 rounded-lg px-1 py-1", s.done && "bg-success-bg")}>
                      <span className="w-6 pb-3 text-center text-base font-semibold text-muted-foreground">{i + 1}</span>
                      {logFields.map((f) => (
                        <FieldInput key={f.key} field={f} value={s.values[f.key] ?? ""} onChange={(v) => updateValue(fb.id, i, f.key, v)} big />
                      ))}
                      <button type="button" aria-label={s.done ? "Mark set not done" : "Mark set done"} onClick={() => toggleDone(fb.id, i)} className={cn("mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors", s.done ? "border-success bg-success text-white" : "border-input text-muted-foreground hover:border-success")}>
                        <Icon name="check" size={18} strokeWidth={2.6} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => addSet(fb.id)}>
                  <Icon name="plus" size={14} /> Add set
                </Button>
              </div>
            </div>

            {/* Prev / Next */}
            <div
              className="flex items-center gap-3 border-t border-border px-4 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
            >
              <Button type="button" variant="outline" className="h-12 flex-1" disabled={fi === 0} onClick={() => setFocusIdx(fi - 1)}>
                <Icon name="chevronRight" size={16} className="rotate-180" /> Prev
              </Button>
              {isLast ? (
                <Button type="button" className="h-12 flex-1" onClick={() => setFocus(false)}>
                  Review &amp; finish
                </Button>
              ) : (
                <Button type="button" className="h-12 flex-1" onClick={() => setFocusIdx(fi + 1)}>
                  Next <Icon name="chevronRight" size={16} />
                </Button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sticky action bar with rest timer */}
      <div
        className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border px-4 py-3 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
          {rest ? (
            <div className="flex flex-1 items-center gap-2 rounded-[var(--radius)] bg-primary/10 px-3 py-2">
              <Icon name="clock" size={18} className="text-primary" />
              <span className="font-mono text-lg font-semibold tabular-nums text-primary">
                {Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, "0")}
              </span>
              <div className="ml-auto flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setRest((r) => (r ? { ...r, left: r.left + 15 } : r))}>+15s</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRest(null)}>Skip</Button>
              </div>
            </div>
          ) : (
            <span className="hidden text-sm text-muted-foreground sm:block">
              {totalSets} set{totalSets === 1 ? "" : "s"} logged
            </span>
          )}
          <Button type="button" variant="outline" onClick={() => router.push(`/clients/${clientId}/training`)} className="h-12">
            Cancel
          </Button>
          <SaveButton />
        </div>
      </div>

      {celebrating && state.prs && (
        <PRCelebration prs={state.prs} onDone={() => router.push(`/clients/${clientId}/training`)} />
      )}
    </form>
  );
}

function AddExercise({
  modality,
  noun,
  onPick,
  planLinked,
}: {
  modality: Modality;
  noun: string;
  onPick: (name: string) => void;
  planLinked?: boolean;
}) {
  const label = planLinked ? `Add extra ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`;
  return (
    <Modal
      title={label}
      description={planLinked ? "Logged as off-plan so your trainer sees the change." : undefined}
      trigger={(open) => (
        <Button type="button" variant={planLinked ? "outline" : "primary"} onClick={open}>
          <Icon name="plus" size={16} /> {label}
        </Button>
      )}
    >
      {(close) => <ExercisePicker modality={modality} onPick={(n) => { onPick(n); close(); }} />}
    </Modal>
  );
}

/** Plan-first start screen: pick the prescribed plan day to log against. */
function PlanStart({ plans, onPick }: { plans: WorkoutPlan[]; onPick: (plan: WorkoutPlan, dayIdx: number) => void }) {
  const ordered = [...plans].sort((a, b) => Number(b.is_active) - Number(a.is_active));
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Icon name="dumbbell" size={15} className="text-primary" /> Log against the plan
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Pick the day your client is doing — its prescribed work loads in, ready to tick off.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {ordered.map((p) => {
          const days = p.days.map((d, i) => ({ d, i })).filter(({ d }) => d.items.length > 0);
          if (days.length === 0) return null;
          return (
            <div key={p.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {p.name}{p.is_active ? " · active" : ""}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {days.map(({ d, i }) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onPick(p, i)}
                    className="flex flex-col gap-0.5 rounded-[var(--radius)] border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="text-sm font-semibold">
                      {d.day}{d.title ? ` · ${d.title}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.items.length} {d.items.length === 1 ? "exercise" : "exercises"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExercisePicker({ modality, onPick }: { modality: Modality; onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const results = searchMovements(q, showAll ? "all" : modality, 12);
  const exact = results.some((r) => r.name.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="flex flex-col gap-3">
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movements…" />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-primary)]" />
        Show all streams
      </label>
      <div className="max-h-72 overflow-y-auto">
        {q.trim() && !exact && (
          <button type="button" onClick={() => onPick(q.trim())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted">
            <Icon name="plus" size={16} className="text-primary" />
            Add &quot;<span className="font-medium">{q.trim()}</span>&quot;
          </button>
        )}
        {results.map((e) => (
          <button key={`${e.modality}-${e.name}`} type="button" onClick={() => onPick(e.name)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted">
            <span className="font-medium">{e.name}</span>
            <span className="text-xs text-muted-foreground">{e.group}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddFromPlan({ plans, onLoad }: { plans: WorkoutPlan[]; onLoad: (items: PlanItem[]) => void }) {
  const options = plans.flatMap((p) =>
    p.days.filter((d) => d.items.length).map((d, i) => ({ key: `${p.id}:${i}`, label: `${p.name}: ${d.day}${d.title ? ` · ${d.title}` : ""}`, items: d.items })),
  );
  if (options.length === 0) return null;
  return (
    <Modal
      title="Load from plan"
      description="Pull a day's exercises from the client's plan."
      trigger={(open) => (
        <Button type="button" variant="outline" onClick={open}>
          <Icon name="dumbbell" size={16} /> From plan
        </Button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-1">
          {options.map((o) => (
            <button key={o.key} type="button" onClick={() => { onLoad(o.items); close(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-muted">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

function PRCelebration({ prs, onDone }: { prs: EntryState["prs"]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onDone}>
      <div className="animate-pop w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-bg text-warning">
          <Icon name="flame" size={28} />
        </div>
        <h2 className="mt-4 text-lg font-bold">
          {prs && prs.length > 1 ? `${prs.length} new personal records!` : "New personal record!"}
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5">
          {prs?.map((p, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{p.exercise_name}</span>{" "}
              <span className="text-muted-foreground">{p.label}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onDone} className="mt-5 w-full">Nice work</Button>
      </div>
    </div>
  );
}
