"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FOOD_NAMES, findFood } from "@/lib/catalog/foods";
import { MEALS, dayTotals, mealOrder } from "@/lib/nutrition";
import { todayISO, formatNumber } from "@/lib/format";
import type { ClientLogState } from "@/app/log/[token]/actions";
import type { MealType } from "@/lib/types";

interface PlanLite {
  name: string;
  target_calories: number | null;
  target_protein_g: number | null;
  days: { meals: { meal: MealType; time: string; items: { food: string; qty: string; calories: string; protein: string }[] }[] }[];
}
interface DraftLite {
  logged_on: string;
  water_ml: number | null;
  notes: string | null;
  entries: { meal: MealType; eaten_at: string | null; food: string; quantity: string | null; calories: number | null; protein_g: number | null; notes: string | null }[];
}

interface EntryRow {
  meal: MealType;
  eaten_at: string;
  food: string;
  quantity: string;
  calories: string;
  protein: string;
}

const emptyRow = (meal: MealType = "breakfast"): EntryRow => ({
  meal,
  eaten_at: "",
  food: "",
  quantity: "",
  calories: "",
  protein: "",
});

function rowsFromDraft(draft: DraftLite): EntryRow[] {
  return draft.entries.map((e) => ({
    meal: e.meal,
    eaten_at: e.eaten_at ?? "",
    food: e.food,
    quantity: e.quantity ?? "",
    calories: e.calories != null ? String(e.calories) : "",
    protein: e.protein_g != null ? String(e.protein_g) : "",
  }));
}

function rowsFromPlan(plan: PlanLite): EntryRow[] {
  const day = plan.days[0];
  if (!day) return [];
  const rows: EntryRow[] = [];
  for (const m of day.meals) {
    for (const it of m.items) {
      rows.push({ meal: m.meal, eaten_at: m.time ?? "", food: it.food, quantity: it.qty ?? "", calories: it.calories ?? "", protein: it.protein ?? "" });
    }
  }
  return rows;
}

function SendButton({ resend }: { resend: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="h-12 flex-1">
      {pending ? "Sending…" : resend ? "Update my log" : "Send to my trainer"}
    </Button>
  );
}

export function ClientDietLogger({
  action,
  businessName,
  plan,
  draft,
}: {
  action: (prev: ClientLogState, formData: FormData) => Promise<ClientLogState>;
  businessName: string | null;
  plan: PlanLite | null;
  draft: DraftLite | null;
}) {
  const [state, formAction] = useActionState<ClientLogState, FormData>(action, {});
  const [loggedOn, setLoggedOn] = useState(draft?.logged_on ?? todayISO());
  const [water, setWater] = useState(draft?.water_ml != null ? String(draft.water_ml) : "");
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [rows, setRows] = useState<EntryRow[]>(
    draft ? rowsFromDraft(draft) : plan ? rowsFromPlan(plan) : [emptyRow()],
  );

  const updateRow = (i: number, patch: Partial<EntryRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow(rs[rs.length - 1]?.meal ?? "breakfast")]);
  const removeRow = (i: number) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));

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
        notes: "",
      }))
      .sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal));
    return JSON.stringify(kept);
  }, [rows]);

  const totals = dayTotals(
    rows.map((r) => ({ calories: r.calories ? Number(r.calories) : null, protein_g: r.protein ? Number(r.protein) : null })),
  );

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Icon name="check" size={24} />
        </span>
        <h1 className="mt-4 text-base font-semibold">Sent — thank you!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {businessName ? `${businessName} will` : "Your trainer will"} review what you logged for {loggedOn}.
          You can update today&apos;s log any time from this link.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 pb-28">
      <input type="hidden" name="logged_on" value={loggedOn} />
      <input type="hidden" name="water_ml" value={water} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="entries" value={entriesJson} />

      <datalist id="client-food-catalog">
        {FOOD_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {plan && (plan.target_calories != null || plan.target_protein_g != null) && (
        <div className="rounded-[var(--radius)] border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">{plan.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Daily target:{" "}
            {plan.target_calories != null ? `${formatNumber(plan.target_calories)} kcal` : "—"}
            {plan.target_protein_g != null ? ` · ${formatNumber(plan.target_protein_g)} g protein` : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Day" htmlFor="logged_on_input">
          <Input id="logged_on_input" type="date" max={todayISO()} value={loggedOn} onChange={(e) => setLoggedOn(e.target.value)} />
        </Field>
        <Field label="Water" htmlFor="water_input" hint="ml">
          <Input id="water_input" type="number" inputMode="numeric" min="0" value={water} onChange={(e) => setWater(e.target.value)} placeholder="e.g. 2500" />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-card p-2">
            <Select className="h-10 w-28" value={r.meal} onChange={(e) => updateRow(i, { meal: e.target.value as MealType })} aria-label="Meal">
              {MEALS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Input className="h-10 w-20" value={r.eaten_at} onChange={(e) => updateRow(i, { eaten_at: e.target.value })} placeholder="08:00" aria-label="Time" />
            <Input className="h-10 min-w-0 flex-1" list="client-food-catalog" value={r.food} onChange={(e) => setFood(i, e.target.value)} placeholder="What did you eat?" aria-label="Food" />
            <Input className="h-10 w-24" value={r.quantity} onChange={(e) => updateRow(i, { quantity: e.target.value })} placeholder="1 cup" aria-label="Quantity" />
            <Input className="h-10 w-16" inputMode="numeric" value={r.calories} onChange={(e) => updateRow(i, { calories: e.target.value })} placeholder="kcal" aria-label="Calories" />
            <Input className="h-10 w-16" inputMode="decimal" value={r.protein} onChange={(e) => updateRow(i, { protein: e.target.value })} placeholder="g" aria-label="Protein grams" />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove food" onClick={() => removeRow(i)}>
              <Icon name="x" size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addRow}>
        <Icon name="plus" size={14} /> Add food
      </Button>

      <Field label="Notes for your trainer" htmlFor="notes_input">
        <Textarea id="notes_input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How you felt, cravings, anything off-plan…" />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div
        className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border px-4 py-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <div className="mx-auto flex w-full max-w-xl items-center gap-3">
          <span className="hidden flex-1 text-sm text-muted-foreground sm:block">
            ≈ {formatNumber(Math.round(totals.calories))} kcal · {formatNumber(Math.round(totals.protein))} g protein
          </span>
          <SendButton resend={!!draft} />
        </div>
      </div>
    </form>
  );
}
