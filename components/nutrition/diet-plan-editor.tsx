"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { SHARE_BUCKET } from "@/lib/constants";
import { FOOD_NAMES, findFood } from "@/lib/catalog/foods";
import { DIET_TEMPLATES } from "@/lib/catalog/diet-templates";
import { generateDietPlanAction } from "@/app/(dashboard)/clients/[id]/nutrition/plan-ai-actions";
import { MEALS, planDayTotals } from "@/lib/nutrition";
import { formatBytes, formatNumber } from "@/lib/format";
import type { DietPlanState } from "@/app/(dashboard)/clients/[id]/nutrition/plan-actions";
import type { DietPlan, DietPlanDay, DietPlanMeal, DietPlanFoodItem, MealType } from "@/lib/types";

const DAY_OPTIONS = ["Every day", "Training day", "Rest day", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const emptyItem = (): DietPlanFoodItem => ({ food: "", qty: "", calories: "", protein: "", notes: "" });
const emptyMeal = (meal: MealType, time = ""): DietPlanMeal => ({ meal, time, items: [emptyItem()] });
const emptyDay = (day: string): DietPlanDay => ({
  day,
  title: "",
  meals: [
    emptyMeal("breakfast", "08:00"),
    emptyMeal("lunch", "13:00"),
    emptyMeal("snack", "17:00"),
    emptyMeal("dinner", "20:30"),
  ],
});

/** Deep-clone seeded days so editing state never mutates a shared template. */
const cloneDays = (ds: DietPlanDay[]): DietPlanDay[] =>
  ds.map((d) => ({
    day: d.day,
    title: d.title,
    meals: d.meals.map((m) => ({ meal: m.meal, time: m.time, items: m.items.map((it) => ({ ...it })) })),
  }));

function extOf(name: string): string {
  const e = name.includes(".") ? name.split(".").pop() : "";
  return (e || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

export function DietPlanEditor({
  clientId,
  action,
  plan,
  onSuccess,
  onCancel,
}: {
  clientId: string;
  action: (prev: DietPlanState, formData: FormData) => Promise<DietPlanState>;
  plan?: DietPlan;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [days, setDays] = useState<DietPlanDay[]>(
    plan ? plan.days : [emptyDay("Every day")],
  );
  const [name, setName] = useState(plan?.name ?? "");
  const [calTarget, setCalTarget] = useState(plan?.target_calories != null ? String(plan.target_calories) : "");
  const [proTarget, setProTarget] = useState(plan?.target_protein_g != null ? String(plan.target_protein_g) : "");
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New plans open on a quick-start chooser (template / AI / blank); editing an
  // existing plan skips straight to the builder.
  const [started, setStarted] = useState<boolean>(!!plan);
  const [goal, setGoal] = useState("");
  const [aiCals, setAiCals] = useState("");
  const [aiProtein, setAiProtein] = useState("");
  const [prefs, setPrefs] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  function seed(opts: { days: DietPlanDay[]; calories?: number | null; protein?: number | null; name?: string }) {
    setDays(opts.days.length ? cloneDays(opts.days) : [emptyDay("Every day")]);
    if (opts.calories != null) setCalTarget(String(opts.calories));
    if (opts.protein != null) setProTarget(String(opts.protein));
    if (opts.name && !name.trim()) setName(opts.name);
    setStarted(true);
  }

  async function generate() {
    setGenerating(true);
    setGenError(null);
    const res = await generateDietPlanAction({
      goal,
      calories: aiCals,
      protein: aiProtein,
      preferences: prefs,
    });
    setGenerating(false);
    if (res.ok && res.days) {
      seed({ days: res.days, calories: res.targetCalories, protein: res.targetProtein });
    } else {
      setGenError(res.error ?? "Something went wrong generating the plan.");
    }
  }

  // ---- day / meal / item mutations ----
  const updateDay = (di: number, patch: Partial<DietPlanDay>) =>
    setDays((ds) => ds.map((d, i) => (i === di ? { ...d, ...patch } : d)));
  const addDay = () => {
    const used = new Set(days.map((d) => d.day));
    setDays((ds) => [...ds, emptyDay(DAY_OPTIONS.find((o) => !used.has(o)) ?? "Every day")]);
  };
  const removeDay = (di: number) => setDays((ds) => ds.filter((_, i) => i !== di));
  const updateMeal = (di: number, mi: number, patch: Partial<DietPlanMeal>) =>
    setDays((ds) =>
      ds.map((d, i) =>
        i === di ? { ...d, meals: d.meals.map((m, j) => (j === mi ? { ...m, ...patch } : m)) } : d,
      ),
    );
  const addMeal = (di: number) =>
    setDays((ds) => ds.map((d, i) => (i === di ? { ...d, meals: [...d.meals, emptyMeal("snack")] } : d)));
  const removeMeal = (di: number, mi: number) =>
    setDays((ds) => ds.map((d, i) => (i === di ? { ...d, meals: d.meals.filter((_, j) => j !== mi) } : d)));
  const updateItem = (di: number, mi: number, ii: number, patch: Partial<DietPlanFoodItem>) =>
    updateMeal(di, mi, {
      items: days[di].meals[mi].items.map((it, k) => (k === ii ? { ...it, ...patch } : it)),
    });
  const addItem = (di: number, mi: number) =>
    updateMeal(di, mi, { items: [...days[di].meals[mi].items, emptyItem()] });
  const removeItem = (di: number, mi: number, ii: number) =>
    updateMeal(di, mi, { items: days[di].meals[mi].items.filter((_, k) => k !== ii) });

  /** Typing a catalog food fills in its serving + numbers (only into empty fields). */
  function setFood(di: number, mi: number, ii: number, food: string) {
    const it = days[di].meals[mi].items[ii];
    const match = findFood(food);
    updateItem(di, mi, ii, {
      food,
      ...(match && {
        qty: it.qty || match.serving,
        calories: it.calories || String(match.calories),
        protein: it.protein || String(match.protein),
      }),
    });
  }

  // Serialize, dropping blank foods and meals left empty.
  const cleanDays = days
    .map((d) => ({
      ...d,
      meals: d.meals
        .map((m) => ({ ...m, items: m.items.filter((it) => it.food.trim()) }))
        .filter((m) => m.items.length),
    }))
    .filter((d) => d.meals.length || d.title.trim());

  const hasExisting = !!plan?.storage_path && !removeAttachment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (file && file.size > MAX_BYTES) return setError("File must be 25 MB or smaller.");

    const fd = new FormData(e.currentTarget);
    fd.set("days", JSON.stringify(cleanDays));
    fd.set("remove_attachment", removeAttachment ? "true" : "false");

    setBusy(true);
    setError(null);
    const supabase = createClient();
    let uploaded: string | null = null;
    try {
      if (file) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Your session expired. Please sign in again.");
          setBusy(false);
          return;
        }
        const path = `${user.id}/${clientId}/${crypto.randomUUID()}.${extOf(file.name)}`;
        const up = await supabase.storage
          .from(SHARE_BUCKET)
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (up.error) {
          setError(`Upload failed: ${up.error.message}`);
          setBusy(false);
          return;
        }
        uploaded = path;
        fd.set("storage_path", path);
        fd.set("original_name", file.name);
        fd.set("content_type", file.type || "");
        fd.set("size_bytes", String(file.size));
      }
      const res = await action({}, fd);
      if (res.error) {
        if (uploaded) await supabase.storage.from(SHARE_BUCKET).remove([uploaded]);
        setError(res.error);
        setBusy(false);
        return;
      }
      onSuccess();
    } catch (err) {
      if (uploaded) await supabase.storage.from(SHARE_BUCKET).remove([uploaded]);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium">Start from a template</p>
          <p className="text-sm text-muted-foreground">Seed a day of meals and targets, then edit anything.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DIET_TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => seed({ days: t.days, calories: t.target_calories, protein: t.target_protein_g, name: t.label.split(" · ")[0] })}
                className="flex flex-col gap-1 rounded-[var(--radius)] border border-border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
              >
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Icon name="sparkles" size={15} className="text-primary" /> Generate with AI
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Describe the client&apos;s goal — Claude drafts a day of meals and targets, and you refine them.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Goal" htmlFor="ai-goal">
              <Input
                id="ai-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. lose fat while keeping muscle, vegetarian"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Calorie target" htmlFor="ai-cals" hint="optional">
                <Input id="ai-cals" inputMode="numeric" value={aiCals} onChange={(e) => setAiCals(e.target.value)} placeholder="e.g. 1800" />
              </Field>
              <Field label="Protein target" htmlFor="ai-protein" hint="optional, grams">
                <Input id="ai-protein" inputMode="numeric" value={aiProtein} onChange={(e) => setAiProtein(e.target.value)} placeholder="e.g. 140" />
              </Field>
            </div>
            <Field label="Preferences / restrictions" htmlFor="ai-prefs">
              <Input
                id="ai-prefs"
                value={prefs}
                onChange={(e) => setPrefs(e.target.value)}
                placeholder="e.g. vegetarian, no dairy, South Indian breakfasts"
              />
            </Field>
            {genError && <p className="text-sm text-danger">{genError}</p>}
            <Button type="button" onClick={generate} disabled={generating} className="self-start">
              <Icon name="sparkles" size={15} /> {generating ? "Generating…" : "Generate draft"}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="secondary" onClick={() => setStarted(true)}>
            Start blank
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <datalist id="diet-food-catalog">
        {FOOD_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Plan name" htmlFor="name" required>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fat loss, phase 1" required />
        </Field>
        <Field label=" " htmlFor="is_active">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={plan?.is_active ?? true}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Set as the client&apos;s active diet plan
          </label>
        </Field>
        <Field label="Daily calorie target" htmlFor="target_calories" hint="kcal per day">
          <Input
            id="target_calories"
            name="target_calories"
            type="number"
            inputMode="numeric"
            min="0"
            value={calTarget}
            onChange={(e) => setCalTarget(e.target.value)}
            placeholder="e.g. 2000"
          />
        </Field>
        <Field label="Daily protein target" htmlFor="target_protein_g" hint="grams per day">
          <Input
            id="target_protein_g"
            name="target_protein_g"
            type="number"
            inputMode="numeric"
            min="0"
            value={proTarget}
            onChange={(e) => setProTarget(e.target.value)}
            placeholder="e.g. 140"
          />
        </Field>
      </div>

      {/* Upload an existing plan */}
      <div className="rounded-[var(--radius)] border border-dashed border-border p-3">
        <p className="text-sm font-medium">Attach a plan file</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Already have the plan as a PDF, image or doc? Attach it. You can use the meal builder below too, or skip it.
        </p>
        {hasExisting && !file && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Icon name="file" size={15} className="text-muted-foreground" />
            <span className="font-medium">{plan?.original_name ?? "Attached file"}</span>
            {plan?.size_bytes != null && (
              <span className="text-xs text-muted-foreground">{formatBytes(plan.size_bytes)}</span>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveAttachment(true)}>
              Remove
            </Button>
          </div>
        )}
        {removeAttachment && !file && (
          <p className="mt-2 text-xs text-muted-foreground">
            The attached file will be removed when you save.{" "}
            <button type="button" className="underline" onClick={() => setRemoveAttachment(false)}>
              Undo
            </button>
          </p>
        )}
        <input
          type="file"
          aria-label="Plan file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-[var(--radius)] file:border file:border-input file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {file && hasExisting && (
          <p className="mt-1 text-xs text-muted-foreground">This replaces the current attachment.</p>
        )}
      </div>

      {/* Meal builder */}
      <div className="flex flex-col gap-4">
        {days.map((d, di) => {
          const totals = planDayTotals(d);
          return (
            <div key={di} className="rounded-[var(--radius)] border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  className="h-9 w-36"
                  value={d.day}
                  onChange={(e) => updateDay(di, { day: e.target.value })}
                  aria-label="Day"
                >
                  {DAY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
                <Input
                  className="h-9 min-w-0 flex-1"
                  value={d.title}
                  onChange={(e) => updateDay(di, { title: e.target.value })}
                  placeholder="Note (e.g. High carb, 3L water)"
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove day" onClick={() => removeDay(di)}>
                  <Icon name="x" size={16} />
                </Button>
              </div>
              {(totals.calories > 0 || totals.protein > 0) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  ≈ {formatNumber(totals.calories)} kcal · {formatNumber(totals.protein)} g protein
                </p>
              )}

              <div className="mt-3 flex flex-col gap-3">
                {d.meals.map((m, mi) => (
                  <div key={mi} className="rounded-lg bg-muted/40 p-2.5">
                    <div className="flex items-center gap-2">
                      <Select
                        className="h-9 w-32"
                        value={m.meal}
                        onChange={(e) => updateMeal(di, mi, { meal: e.target.value as MealType })}
                        aria-label="Meal"
                      >
                        {MEALS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                      <Input
                        className="h-9 w-32"
                        value={m.time}
                        onChange={(e) => updateMeal(di, mi, { time: e.target.value })}
                        placeholder="Time (08:00)"
                        aria-label="Time"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        aria-label="Remove meal"
                        onClick={() => removeMeal(di, mi)}
                      >
                        <Icon name="x" size={14} />
                      </Button>
                    </div>

                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[560px] text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="pb-1 pr-2 font-medium">Food</th>
                            <th className="pb-1 px-2 font-medium">Qty</th>
                            <th className="pb-1 px-2 font-medium">kcal</th>
                            <th className="pb-1 px-2 font-medium">Protein g</th>
                            <th className="pb-1" />
                          </tr>
                        </thead>
                        <tbody>
                          {m.items.map((it, ii) => (
                            <tr key={ii}>
                              <td className="py-1 pr-2">
                                <Input
                                  className="h-9"
                                  list="diet-food-catalog"
                                  value={it.food}
                                  onChange={(e) => setFood(di, mi, ii, e.target.value)}
                                  placeholder="e.g. Paneer bhurji"
                                />
                              </td>
                              <td className="py-1 px-2">
                                <Input className="h-9 w-24" value={it.qty} onChange={(e) => updateItem(di, mi, ii, { qty: e.target.value })} placeholder="1 cup" />
                              </td>
                              <td className="py-1 px-2">
                                <Input className="h-9 w-20" inputMode="numeric" value={it.calories} onChange={(e) => updateItem(di, mi, ii, { calories: e.target.value })} placeholder="250" />
                              </td>
                              <td className="py-1 px-2">
                                <Input className="h-9 w-20" inputMode="decimal" value={it.protein} onChange={(e) => updateItem(di, mi, ii, { protein: e.target.value })} placeholder="18" />
                              </td>
                              <td className="py-1 pl-1">
                                <Button type="button" variant="ghost" size="icon" aria-label="Remove food" onClick={() => removeItem(di, mi, ii)}>
                                  <Icon name="x" size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-1.5" onClick={() => addItem(di, mi)}>
                      <Icon name="plus" size={14} /> Add food
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => addMeal(di)}>
                <Icon name="plus" size={14} /> Add meal
              </Button>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="secondary" size="sm" className="self-start" onClick={addDay}>
        <Icon name="plus" size={14} /> Add day
      </Button>

      <Field label="Plan notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          defaultValue={plan?.notes ?? ""}
          placeholder="Hydration, supplements, foods to avoid, cheat-meal rules…"
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy ? (file ? "Uploading…" : "Saving…") : "Save plan"}
        </Button>
      </div>
    </form>
  );
}
