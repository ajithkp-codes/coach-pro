"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { searchExercises } from "@/lib/catalog/exercises";
import { todayISO, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryState } from "@/app/(dashboard)/clients/[id]/training/actions";
import type { WorkoutSessionWithSets, WorkoutPlan, PlanItem } from "@/lib/types";
import type { LastExercise } from "@/lib/data/training";

interface SetRow { weight: string; reps: string; rpe: string; done: boolean }
interface Block { id: string; name: string; sets: SetRow[] }

let uid = 0;
const newId = () => `b${Date.now()}_${uid++}`;
const emptySet = (): SetRow => ({ weight: "", reps: "", rpe: "", done: false });

const leadingNumber = (s: string) => {
  const m = (s ?? "").match(/-?\d+(\.\d+)?/);
  return m ? m[0] : "";
};
const setCount = (s: string) => {
  const n = parseInt(leadingNumber(s || "1"), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : 1;
};

function blocksFromSession(session: WorkoutSessionWithSets): Block[] {
  const blocks: Block[] = [];
  for (const s of session.sets) {
    const last = blocks[blocks.length - 1];
    const row: SetRow = {
      weight: s.weight_kg != null ? String(s.weight_kg) : "",
      reps: s.reps != null ? String(s.reps) : "",
      rpe: s.rpe != null ? String(s.rpe) : "",
      done: false,
    };
    if (last && last.name === s.exercise_name) last.sets.push(row);
    else blocks.push({ id: newId(), name: s.exercise_name, sets: [row] });
  }
  return blocks;
}

function blocksFromPlanDay(items: PlanItem[]): Block[] {
  return items.map((it) => {
    const reps = /^\s*\d+\s*$/.test(it.reps ?? "") ? it.reps.trim() : "";
    const weight = leadingNumber(it.weight ?? "");
    return {
      id: newId(),
      name: it.exercise_name,
      sets: Array.from({ length: setCount(it.sets) }, () => ({ weight, reps, rpe: "", done: false })),
    };
  });
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 flex-1 text-base">
      {pending ? "Saving…" : "Finish workout"}
    </Button>
  );
}

export function WorkoutLogger({
  clientId,
  action,
  session,
  plans = [],
  lastByExercise,
  prefill,
}: {
  clientId: string;
  action: (prev: EntryState, formData: FormData) => Promise<EntryState>;
  session?: WorkoutSessionWithSets;
  plans?: WorkoutPlan[];
  lastByExercise: Record<string, LastExercise>;
  prefill?: PlanItem[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<EntryState, FormData>(action, {});

  const [performedOn, setPerformedOn] = useState(session?.performed_on ?? todayISO());
  const [title, setTitle] = useState(session?.title ?? "");
  const [duration, setDuration] = useState(
    session?.duration_min != null ? String(session.duration_min) : "",
  );
  const [blocks, setBlocks] = useState<Block[]>(
    session ? blocksFromSession(session) : prefill ? blocksFromPlanDay(prefill) : [],
  );

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
    setBlocks((b) => [...b, { id: newId(), name, sets: [emptySet()] }]);
  const removeBlock = (id: string) => setBlocks((b) => b.filter((x) => x.id !== id));
  const addSet = (id: string) =>
    setBlocks((b) =>
      b.map((x) => (x.id === id ? { ...x, sets: [...x.sets, { ...x.sets[x.sets.length - 1] ?? emptySet(), done: false }] } : x)),
    );
  const removeSet = (id: string, i: number) =>
    setBlocks((b) =>
      b.map((x) => (x.id === id ? { ...x, sets: x.sets.length === 1 ? [emptySet()] : x.sets.filter((_, j) => j !== i) } : x)),
    );
  const updateSet = (id: string, i: number, patch: Partial<SetRow>) =>
    setBlocks((b) =>
      b.map((x) => (x.id === id ? { ...x, sets: x.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) } : x)),
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

  // Serialize to the flat sets payload.
  const setsJson = useMemo(() => {
    const flat: { exercise_name: string; reps: string; weight_kg: string; rpe: string }[] = [];
    for (const blk of blocks) {
      if (!blk.name.trim()) continue;
      for (const s of blk.sets) {
        if (!s.weight && !s.reps) continue; // skip truly empty sets
        flat.push({ exercise_name: blk.name, reps: s.reps, weight_kg: s.weight, rpe: s.rpe });
      }
    }
    return JSON.stringify(flat);
  }, [blocks]);

  const totalSets = blocks.reduce((n, b) => n + b.sets.filter((s) => s.weight || s.reps).length, 0);

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

      {blocks.length > 0 && (
        <div className="flex justify-end">
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
              <p className="font-semibold text-primary">{blk.name}</p>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove exercise" onClick={() => removeBlock(blk.id)}>
                <Icon name="x" size={16} />
              </Button>
            </div>
            {last && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last: {last.sets.map((s) => `${s.weight_kg != null ? formatNumber(s.weight_kg) : "-"}×${s.reps != null ? formatNumber(s.reps) : "-"}`).join(", ")}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground">
                <span className="w-6">Set</span>
                <span className="flex-1">Weight (kg)</span>
                <span className="flex-1">Reps</span>
                <span className="w-12">RPE</span>
                <span className="w-9" />
              </div>
              {blk.sets.map((s, i) => {
                const lp = last?.sets[i];
                return (
                  <div key={i} className={cn("flex items-center gap-2 rounded-lg px-1 py-0.5", s.done && "bg-success-bg")}>
                    <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                    <Input
                      className="h-11 flex-1 text-center"
                      type="number" inputMode="decimal" step="0.5"
                      value={s.weight}
                      placeholder={lp?.weight_kg != null ? String(lp.weight_kg) : "-"}
                      onChange={(e) => updateSet(blk.id, i, { weight: e.target.value })}
                    />
                    <Input
                      className="h-11 flex-1 text-center"
                      type="number" inputMode="numeric"
                      value={s.reps}
                      placeholder={lp?.reps != null ? String(lp.reps) : "-"}
                      onChange={(e) => updateSet(blk.id, i, { reps: e.target.value })}
                    />
                    <Input
                      className="h-11 w-12 text-center"
                      type="number" inputMode="decimal" step="0.5" min="0" max="10"
                      value={s.rpe}
                      placeholder="-"
                      onChange={(e) => updateSet(blk.id, i, { rpe: e.target.value })}
                    />
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
                );
              })}
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addSet(blk.id)}>
                <Icon name="plus" size={14} /> Add set
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add exercise / from plan */}
      <div className="flex flex-wrap gap-2">
        <AddExercise onPick={addBlock} />
        {plans.length > 0 && <AddFromPlan plans={plans} onLoad={(items) => setBlocks((b) => [...b, ...blocksFromPlanDay(items)])} />}
      </div>

      {blocks.length === 0 && (
        <p className="rounded-[var(--radius)] border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Add an exercise to start logging, or pull the day from this client&apos;s plan.
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
                Exercise {fi + 1} of {blocks.length}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFocus(false)}>
                <Icon name="x" size={16} /> Exit focus
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="mx-auto flex w-full max-w-md flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{fb.name}</h2>
                  {last && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Last: {last.sets.map((s) => `${s.weight_kg != null ? formatNumber(s.weight_kg) : "-"}×${s.reps != null ? formatNumber(s.reps) : "-"}`).join(", ")}
                    </p>
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
                  {fb.sets.map((s, i) => {
                    const lp = last?.sets[i];
                    return (
                      <div key={i} className={cn("flex items-center gap-2 rounded-lg px-1 py-1", s.done && "bg-success-bg")}>
                        <span className="w-6 text-center text-base font-semibold text-muted-foreground">{i + 1}</span>
                        <Input className="h-14 flex-1 text-center text-lg" type="number" inputMode="decimal" step="0.5" value={s.weight} placeholder={lp?.weight_kg != null ? String(lp.weight_kg) : "kg"} onChange={(e) => updateSet(fb.id, i, { weight: e.target.value })} />
                        <Input className="h-14 flex-1 text-center text-lg" type="number" inputMode="numeric" value={s.reps} placeholder={lp?.reps != null ? String(lp.reps) : "reps"} onChange={(e) => updateSet(fb.id, i, { reps: e.target.value })} />
                        <Input className="h-14 w-14 text-center text-lg" type="number" inputMode="decimal" step="0.5" min="0" max="10" value={s.rpe} placeholder="RPE" onChange={(e) => updateSet(fb.id, i, { rpe: e.target.value })} />
                        <button type="button" aria-label={s.done ? "Mark set not done" : "Mark set done"} onClick={() => toggleDone(fb.id, i)} className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors", s.done ? "border-success bg-success text-white" : "border-input text-muted-foreground hover:border-success")}>
                          <Icon name="check" size={18} strokeWidth={2.6} />
                        </button>
                      </div>
                    );
                  })}
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

function AddExercise({ onPick }: { onPick: (name: string) => void }) {
  return (
    <Modal
      title="Add exercise"
      trigger={(open) => (
        <Button type="button" onClick={open}>
          <Icon name="plus" size={16} /> Add exercise
        </Button>
      )}
    >
      {(close) => <ExercisePicker onPick={(n) => { onPick(n); close(); }} />}
    </Modal>
  );
}

function ExercisePicker({ onPick }: { onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const results = searchExercises(q, 10);
  const exact = results.some((r) => r.name.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="flex flex-col gap-3">
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…" />
      <div className="max-h-72 overflow-y-auto">
        {q.trim() && !exact && (
          <button type="button" onClick={() => onPick(q.trim())} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted">
            <Icon name="plus" size={16} className="text-primary" />
            Add &quot;<span className="font-medium">{q.trim()}</span>&quot;
          </button>
        )}
        {results.map((e) => (
          <button key={e.name} type="button" onClick={() => onPick(e.name)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted">
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
              <span className="text-muted-foreground">
                {formatNumber(p.weight, "kg")}
                {p.reps != null ? ` × ${formatNumber(p.reps)}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <Button onClick={onDone} className="mt-5 w-full">Nice work</Button>
      </div>
    </div>
  );
}
