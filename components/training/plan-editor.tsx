"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { PlanState } from "@/app/(dashboard)/clients/[id]/training/plan-actions";
import { generatePlanAction } from "@/app/(dashboard)/clients/[id]/training/plan-ai-actions";
import {
  getModality,
  readyModalities,
  DEFAULT_MODALITY,
  type Modality,
  type PlanField,
} from "@/lib/catalog/modalities";
import { movementsForModality } from "@/lib/catalog/movements";
import { focusAreasForModality, groupsForFocus, isRestFocus } from "@/lib/catalog/focus";
import { CADENCE_PRESETS, cadenceWeeks } from "@/lib/catalog/plan-cadence";
import type { WorkoutPlan, PlanDay, PlanItem, PlanCadence } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyItem = (): PlanItem => ({ exercise_name: "", sets: "", reps: "", weight: "", notes: "" });
const emptyDay = (day: string): PlanDay => ({ day, title: "", items: [emptyItem()] });

/** Deep-clone seeded days so editing state never mutates a shared template; the
 * spread preserves the per-day `modality` override and every optional item field. */
const cloneDays = (ds: PlanDay[]): PlanDay[] =>
  ds.map((d) => ({ ...d, items: d.items.map((it) => ({ ...it })) }));

/** Read a free-text plan field off an item (optional fields default to ""). */
const fieldValue = (it: PlanItem, field: PlanField): string =>
  (it[field] as string | undefined) ?? "";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save plan"}
    </Button>
  );
}

export function PlanEditor({
  action,
  plan,
  onSuccess,
  onCancel,
}: {
  action: (prev: PlanState, formData: FormData) => Promise<PlanState>;
  plan?: WorkoutPlan;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<PlanState, FormData>(action, {});
  const [days, setDays] = useState<PlanDay[]>(
    plan && plan.days.length ? plan.days : [emptyDay("Mon")],
  );
  const [planModality, setPlanModality] = useState<Modality>(
    plan?.modality ?? DEFAULT_MODALITY,
  );

  // Scheduling: the weekly structure repeats for the chosen cadence/length.
  const [cadence, setCadence] = useState<PlanCadence>(plan?.cadence ?? "weekly");
  const [customWeeks, setCustomWeeks] = useState(String(plan?.duration_weeks ?? 1));
  const [startsOn, setStartsOn] = useState(plan?.starts_on ?? "");
  const durationWeeks = cadenceWeeks(cadence, Number(customWeeks));

  // New plans open on a quick-start chooser: step 1 picks the training type, step 2
  // picks how to create (build / template / AI). Editing an existing plan skips both.
  const [started, setStarted] = useState<boolean>(!!plan);
  const [qsStep, setQsStep] = useState<"type" | "method">("type");
  const [goal, setGoal] = useState("");
  const [dpw, setDpw] = useState("3");
  const [customDays, setCustomDays] = useState("3");
  const [exp, setExp] = useState("intermediate");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // "Add from library" panel: which day it's open for, its search, show-all toggle.
  const [libFor, setLibFor] = useState<number | null>(null);
  const [libQuery, setLibQuery] = useState("");
  const [libShowAll, setLibShowAll] = useState(false);

  const streams = readyModalities();

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  /** The modality a given day is edited/logged under (override, else plan default). */
  const dayModality = (d: PlanDay): Modality => d.modality ?? planModality;

  function seed(newDays: PlanDay[], modality: Modality) {
    setPlanModality(modality);
    setDays(newDays.length ? cloneDays(newDays).map((d) => ({ ...d, modality })) : [emptyDay("Mon")]);
    setStarted(true);
  }

  /** Build-from-scratch: N empty days (stamped with the chosen stream), then drop
   * into the editor. The movement library stays collapsed — trainers type names
   * directly (the cell autocompletes), or open "Add from library" to browse. */
  function buildOwn(count: number) {
    const n = Math.min(7, Math.max(1, count || 1));
    const newDays: PlanDay[] = Array.from({ length: n }, (_, i) => ({
      day: WEEKDAYS[i % 7],
      title: "",
      items: [],
      modality: planModality,
    }));
    setDays(newDays);
    setStarted(true);
    setLibFor(null);
    setLibQuery("");
    setLibShowAll(false);
  }

  async function generate() {
    setGenerating(true);
    setGenError(null);
    const res = await generatePlanAction({
      goal,
      daysPerWeek: Number(dpw),
      experience: exp,
      modality: planModality,
    });
    setGenerating(false);
    if (res.ok && res.days) seed(res.days, planModality);
    else setGenError(res.error ?? "Something went wrong generating the plan.");
  }

  function updateDay(i: number, patch: Partial<PlanDay>) {
    setDays((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function addDay() {
    const used = new Set(days.map((d) => d.day));
    const next = WEEKDAYS.find((w) => !used.has(w)) ?? "Mon";
    setDays((ds) => [...ds, emptyDay(next)]);
  }
  function removeDay(i: number) {
    setDays((ds) => (ds.length === 1 ? ds : ds.filter((_, idx) => idx !== i)));
  }
  function updateItemField(di: number, ii: number, field: PlanField | "exercise_name", value: string) {
    setDays((ds) =>
      ds.map((d, idx) =>
        idx === di
          ? { ...d, items: d.items.map((it, j) => (j === ii ? { ...it, [field]: value } : it)) }
          : d,
      ),
    );
  }
  function addItem(di: number, name = "") {
    setDays((ds) =>
      ds.map((d, idx) =>
        idx === di ? { ...d, items: [...d.items, { ...emptyItem(), exercise_name: name }] } : d,
      ),
    );
  }
  function removeItem(di: number, ii: number) {
    setDays((ds) =>
      ds.map((d, idx) => (idx === di ? { ...d, items: d.items.filter((_, j) => j !== ii) } : d)),
    );
  }

  // Serialize, dropping exercises with no name. Per-day `modality` rides along in the spread.
  const daysJson = JSON.stringify(
    days.map((d) => ({ ...d, items: d.items.filter((it) => it.exercise_name.trim()) })),
  );

  // Step 1 of the quick-start: pick the training type, then continue to the methods.
  if (!started && qsStep === "type") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium">Type of training</p>
          <p className="text-sm text-muted-foreground">
            Pick the stream — the plan uses its movements and tracks the right numbers.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {streams.map((m) => {
              const selected = planModality === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPlanModality(m.key)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary hover:bg-muted/50"
                  }`}
                >
                  <Icon name={m.icon} size={16} className={selected ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-medium">{m.short}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {getModality(planModality).description}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={() => setQsStep("method")}>
            Continue <Icon name="chevronRight" size={15} />
          </Button>
        </div>
      </div>
    );
  }

  // Step 2 of the quick-start: having picked the type, choose how to create the plan.
  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <Icon name={getModality(planModality).icon} size={16} className="text-primary" />
            <span className="font-medium">{getModality(planModality).short}</span>
            <span className="text-muted-foreground">— choose how to create the plan</span>
          </p>
          <button
            type="button"
            onClick={() => setQsStep("type")}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Change type
          </button>
        </div>

        <div className="rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icon name="plus" size={15} className="text-primary" /> Build your own
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Start from scratch — set the number of days, then pick {getModality(planModality).itemNoun.toLowerCase()}s
            from the {getModality(planModality).short.toLowerCase()} library and tailor every detail to this client.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="How many days?" htmlFor="custom-days">
              <Select
                id="custom-days"
                className="w-32"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
              >
                {["1", "2", "3", "4", "5", "6", "7"].map((n) => (
                  <option key={n} value={n}>{n} {Number(n) === 1 ? "day" : "days"}</option>
                ))}
              </Select>
            </Field>
            <Button type="button" onClick={() => buildOwn(Number(customDays))}>
              <Icon name="plus" size={15} /> Start building
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="rounded-[var(--radius)] border border-border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icon name="sparkles" size={15} className="text-primary" /> Generate with AI
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Describe the client&apos;s goal — Claude drafts the days and you refine them.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Goal" htmlFor="ai-goal">
              <Input
                id="ai-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. build strength and add muscle, some lower-back caution"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Days per week" htmlFor="ai-dpw">
                <Select id="ai-dpw" value={dpw} onChange={(e) => setDpw(e.target.value)}>
                  {["2", "3", "4", "5", "6"].map((n) => (
                    <option key={n} value={n}>{n} days</option>
                  ))}
                </Select>
              </Field>
              <Field label="Experience" htmlFor="ai-exp">
                <Select id="ai-exp" value={exp} onChange={(e) => setExp(e.target.value)}>
                  {["beginner", "intermediate", "advanced"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </Field>
            </div>
            {genError && <p className="text-sm text-danger">{genError}</p>}
            <Button type="button" onClick={generate} disabled={generating} className="self-start">
              <Icon name="sparkles" size={15} /> {generating ? "Generating…" : "Generate draft"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="days" value={daysJson} />
      <input type="hidden" name="modality" value={planModality} />
      <input type="hidden" name="cadence" value={cadence} />
      <input type="hidden" name="duration_weeks" value={durationWeeks} />
      <input type="hidden" name="starts_on" value={startsOn} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Plan name" htmlFor="name" required>
          <Input id="name" name="name" defaultValue={plan?.name} placeholder="e.g. Strength block, weeks 1-4" required />
        </Field>
        <Field label="Type of training" htmlFor="plan-modality">
          <Select
            id="plan-modality"
            value={planModality}
            onChange={(e) => setPlanModality(e.target.value as Modality)}
          >
            {streams.map((m) => (
              <option key={m.key} value={m.key}>{m.short}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Plan length" htmlFor="plan-cadence">
          <Select
            id="plan-cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as PlanCadence)}
          >
            {CADENCE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </Select>
        </Field>
        {cadence === "custom" && (
          <Field label="Number of weeks" htmlFor="plan-weeks">
            <Input
              id="plan-weeks"
              type="number"
              min="1"
              max="52"
              value={customWeeks}
              onChange={(e) => setCustomWeeks(e.target.value)}
            />
          </Field>
        )}
        <Field label="Start date (optional)" htmlFor="plan-start">
          <Input
            id="plan-start"
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        The {days.length}-day week below repeats for {durationWeeks} week{durationWeeks === 1 ? "" : "s"}
        {startsOn ? ` starting ${startsOn}` : ""}.
      </p>

      <Field label=" " htmlFor="is_active">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={plan?.is_active ?? true}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Set as the client&apos;s active plan
        </label>
      </Field>

      <div className="flex flex-col gap-4">
        {days.map((d, di) => {
          const def = getModality(dayModality(d));
          const cols = def.planColumns;
          const minW = 320 + cols.length * 90;
          // The day's focus (its title) narrows the library to that focus's groups.
          const focusGroups = groupsForFocus(dayModality(d), d.title);
          const focusActive = focusGroups.length > 0 && !libShowAll;
          const basePool = movementsForModality(libShowAll ? "all" : dayModality(d));
          const libPool = focusActive
            ? basePool.filter((m) => focusGroups.includes(m.group))
            : basePool;
          const q = libQuery.trim().toLowerCase();
          const libMatches = q
            ? libPool.filter((m) => m.name.toLowerCase().includes(q))
            : libPool;
          const libGroups = [...new Set(libMatches.map((m) => m.group))];
          const focusOptions = focusAreasForModality(dayModality(d));

          return (
            <div key={di} className="rounded-[var(--radius)] border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  className="h-9 w-24"
                  value={d.day}
                  onChange={(e) => updateDay(di, { day: e.target.value })}
                  aria-label="Day"
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </Select>
                <Input
                  className="h-9 flex-1 min-w-[8rem]"
                  list={`focus-${di}`}
                  value={d.title}
                  onChange={(e) => updateDay(di, { title: e.target.value })}
                  placeholder="Focus — pick or type (e.g. Push, Legs)"
                  aria-label="Focus"
                />
                <datalist id={`focus-${di}`}>
                  {focusOptions.map((f) => (
                    <option key={f.label} value={f.label} />
                  ))}
                </datalist>
                <Select
                  className="h-9 w-36"
                  value={dayModality(d)}
                  onChange={(e) => updateDay(di, { modality: e.target.value as Modality })}
                  aria-label="Day training type"
                  title="Training type for this day"
                >
                  {streams.map((m) => (
                    <option key={m.key} value={m.key}>{m.short}</option>
                  ))}
                </Select>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove day" onClick={() => removeDay(di)}>
                  <Icon name="plus" size={16} className="rotate-45" />
                </Button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: `${minW}px` }}>
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-1 pr-2 font-medium">{def.itemNoun}</th>
                      {cols.map((c) => (
                        <th key={c.field} className="pb-1 px-2 font-medium">{c.label}</th>
                      ))}
                      <th className="pb-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((it, ii) => (
                      <tr key={ii}>
                        <td className="py-1 pr-2">
                          <Input
                            className="h-9"
                            list={`lib-${di}`}
                            value={it.exercise_name}
                            onChange={(e) => updateItemField(di, ii, "exercise_name", e.target.value)}
                            placeholder={`e.g. ${libPool[0]?.name ?? "Movement"}`}
                          />
                        </td>
                        {cols.map((c) => (
                          <td key={c.field} className="py-1 px-2">
                            <Input
                              className={`h-9 ${c.width ?? "w-24"}`}
                              value={fieldValue(it, c.field)}
                              onChange={(e) => updateItemField(di, ii, c.field, e.target.value)}
                              placeholder={c.placeholder}
                            />
                          </td>
                        ))}
                        <td className="py-1 pl-1">
                          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${def.itemNoun.toLowerCase()}`} onClick={() => removeItem(di, ii)}>
                            <Icon name="plus" size={14} className="rotate-45" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Modality-filtered autocomplete for the name cell. */}
                <datalist id={`lib-${di}`}>
                  {movementsForModality(dayModality(d)).map((m) => (
                    <option key={m.name} value={m.name} />
                  ))}
                </datalist>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(di)}>
                  <Icon name="plus" size={14} /> Add {def.itemNoun.toLowerCase()}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLibFor((cur) => (cur === di ? null : di));
                    setLibQuery("");
                    setLibShowAll(false);
                  }}
                >
                  <Icon name="sparkles" size={14} /> Add from library
                </Button>
              </div>

              {libFor === di && (
                <div className="mt-2 rounded-[var(--radius)] border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="h-9 flex-1 min-w-[10rem]"
                      value={libQuery}
                      onChange={(e) => setLibQuery(e.target.value)}
                      placeholder={`Search ${def.label.toLowerCase()} movements…`}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={libShowAll}
                        onChange={(e) => setLibShowAll(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                      />
                      Show all streams
                    </label>
                    <Button type="button" variant="ghost" size="icon" aria-label="Close library" onClick={() => setLibFor(null)}>
                      <Icon name="plus" size={16} className="rotate-45" />
                    </Button>
                  </div>
                  {focusActive && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{d.title}</span> {def.itemNoun.toLowerCase()}s. Tick “Show all streams” to see everything.
                    </p>
                  )}
                  <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                    {isRestFocus(d.title) ? (
                      <p className="text-sm text-muted-foreground">Rest day — no movements to prescribe.</p>
                    ) : libGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {q ? `No movements match “${libQuery}”.` : "Type the movement name directly above to add it."}
                      </p>
                    ) : null}
                    {!isRestFocus(d.title) && libGroups.map((g) => (
                      <div key={g} className="mb-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {libMatches
                            .filter((m) => m.group === g)
                            .map((m) => (
                              <button
                                key={`${m.modality}-${m.name}`}
                                type="button"
                                onClick={() => addItem(di, m.name)}
                                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:border-primary hover:bg-primary/5"
                              >
                                {m.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addDay}>
        <Icon name="plus" size={14} /> Add day
      </Button>

      <Field label="Plan notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={plan?.notes ?? ""} placeholder="Warm-up, progression rules, anything the client should know." />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <SubmitButton />
      </div>
    </form>
  );
}
