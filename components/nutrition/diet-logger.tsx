"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FOOD_NAMES, findFood } from "@/lib/catalog/foods";
import { MEALS, dayTotals, mealOrder } from "@/lib/nutrition";
import { todayISO, formatNumber } from "@/lib/format";
import type { DietLogState } from "@/app/(dashboard)/clients/[id]/nutrition/actions";
import type { DietLogWithEntries, DietPlan, MealType } from "@/lib/types";

interface EntryRow {
  meal: MealType;
  eaten_at: string;
  food: string;
  quantity: string;
  calories: string;
  protein: string;
  notes: string;
}

const emptyRow = (meal: MealType = "breakfast"): EntryRow => ({
  meal,
  eaten_at: "",
  food: "",
  quantity: "",
  calories: "",
  protein: "",
  notes: "",
});

function rowsFromLog(log: DietLogWithEntries): EntryRow[] {
  return log.entries.map((e) => ({
    meal: e.meal,
    eaten_at: e.eaten_at ?? "",
    food: e.food,
    quantity: e.quantity ?? "",
    calories: e.calories != null ? String(e.calories) : "",
    protein: e.protein_g != null ? String(e.protein_g) : "",
    notes: e.notes ?? "",
  }));
}

/** Seed rows from the planned meals of an active plan (used for a fresh day). */
function rowsFromPlan(plan: DietPlan, dayIndex?: number): EntryRow[] {
  const day = dayIndex != null ? plan.days[dayIndex] : plan.days[0];
  if (!day) return [];
  const rows: EntryRow[] = [];
  for (const m of day.meals) {
    for (const it of m.items) {
      rows.push({
        meal: m.meal,
        eaten_at: m.time ?? "",
        food: it.food,
        quantity: it.qty ?? "",
        calories: it.calories ?? "",
        protein: it.protein ?? "",
        notes: "",
      });
    }
  }
  return rows;
}

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12">
      {pending ? "Saving…" : editing ? "Save changes" : "Save log"}
    </Button>
  );
}

export function DietLogger({
  clientId,
  action,
  log,
  plan,
  prefillDay,
}: {
  clientId: string;
  action: (prev: DietLogState, formData: FormData) => Promise<DietLogState>;
  log?: DietLogWithEntries;
  plan?: DietPlan | null;
  prefillDay?: number;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<DietLogState, FormData>(action, {});

  const [loggedOn, setLoggedOn] = useState(log?.logged_on ?? todayISO());
  const [water, setWater] = useState(log?.water_ml != null ? String(log.water_ml) : "");
  const [notes, setNotes] = useState(log?.notes ?? "");
  const [rows, setRows] = useState<EntryRow[]>(
    log ? rowsFromLog(log) : plan ? rowsFromPlan(plan, prefillDay) : [emptyRow()],
  );

  useEffect(() => {
    if (state.ok) router.push(`/clients/${clientId}/nutrition`);
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = (i: number, patch: Partial<EntryRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, emptyRow(rs[rs.length - 1]?.meal ?? "breakfast")]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));

  function setFood(i: number, food: string) {
    const r = rows[i];
    const match = findFood(food);
    updateRow(i, {
      food,
      ...(match && {
        quantity: r.quantity || match.serving,
        calories: r.calories || String(match.calories),
        protein: r.protein || String(match.protein),
      }),
    });
  }

  // Order rows by meal for the payload (keeps display order stable on reload).
  const entriesJson = useMemo(() => {
    const kept = rows
      .filter((r) => r.food.trim())
      .map((r) => ({
        meal: r.meal,
        eaten_at: r.eaten_at,
        food: r.food,
        quantity: r.quantity,
        calories: r.calories,
        protein_g: r.protein,
        notes: r.notes,
      }))
      .sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal));
    return JSON.stringify(kept);
  }, [rows]);

  const totals = dayTotals(
    rows.map((r) => ({
      calories: r.calories ? Number(r.calories) : null,
      protein_g: r.protein ? Number(r.protein) : null,
    })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 pb-28">
      <input type="hidden" name="logged_on" value={loggedOn} />
      <input type="hidden" name="water_ml" value={water} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="entries" value={entriesJson} />

      <datalist id="diet-log-food-catalog">
        {FOOD_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Field label="Date" htmlFor="logged_on_input">
          <Input
            id="logged_on_input"
            type="date"
            max={todayISO()}
            value={loggedOn}
            onChange={(e) => setLoggedOn(e.target.value)}
          />
        </Field>
        <Field label="Water" htmlFor="water_input" hint="ml">
          <Input
            id="water_input"
            type="number"
            inputMode="numeric"
            min="0"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            placeholder="e.g. 2500"
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <div className="hidden items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground sm:flex">
          <span className="w-28">Meal</span>
          <span className="w-20">Time</span>
          <span className="flex-1">Food</span>
          <span className="w-24">Qty</span>
          <span className="w-16">kcal</span>
          <span className="w-16">Protein</span>
          <span className="w-9" />
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-card p-2 sm:flex-nowrap sm:border-0 sm:bg-transparent sm:p-0"
          >
            <Select
              className="h-10 w-28"
              value={r.meal}
              onChange={(e) => updateRow(i, { meal: e.target.value as MealType })}
              aria-label="Meal"
            >
              {MEALS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Input
              className="h-10 w-20"
              value={r.eaten_at}
              onChange={(e) => updateRow(i, { eaten_at: e.target.value })}
              placeholder="08:00"
              aria-label="Time"
            />
            <Input
              className="h-10 min-w-0 flex-1"
              list="diet-log-food-catalog"
              value={r.food}
              onChange={(e) => setFood(i, e.target.value)}
              placeholder="What did they eat?"
              aria-label="Food"
            />
            <Input
              className="h-10 w-24"
              value={r.quantity}
              onChange={(e) => updateRow(i, { quantity: e.target.value })}
              placeholder="1 cup"
              aria-label="Quantity"
            />
            <Input
              className="h-10 w-16"
              inputMode="numeric"
              value={r.calories}
              onChange={(e) => updateRow(i, { calories: e.target.value })}
              placeholder="kcal"
              aria-label="Calories"
            />
            <Input
              className="h-10 w-16"
              inputMode="decimal"
              value={r.protein}
              onChange={(e) => updateRow(i, { protein: e.target.value })}
              placeholder="g"
              aria-label="Protein grams"
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove food" onClick={() => removeRow(i)}>
              <Icon name="x" size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addRow}>
        <Icon name="plus" size={14} /> Add food
      </Button>

      <Field label="Notes" htmlFor="notes_input">
        <Textarea
          id="notes_input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Appetite, cravings, how they felt, anything off-plan…"
        />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div
        className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border px-4 py-3 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <span className="flex-1 text-sm text-muted-foreground">
            ≈ {formatNumber(Math.round(totals.calories))} kcal · {formatNumber(Math.round(totals.protein))} g protein
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}/nutrition`)}
            className="h-12"
          >
            Cancel
          </Button>
          <SaveButton editing={!!log} />
        </div>
      </div>
    </form>
  );
}
