"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authed } from "@/lib/data/session";
import { canAddClient } from "@/lib/data/billing";
import { listClients } from "@/lib/data/clients";
import {
  bulkCreateBodyMetrics,
  bulkCreateClients,
  bulkCreateGoals,
  bulkCreateHealthMarkers,
  bulkCreateWorkoutPlans,
  type ClientInsert,
} from "@/lib/data/import";
import { bulkImportSchema, importRecordSchema } from "@/lib/validation";
import type { BodyMetricInput, GoalInput, HealthMarkerInput, WorkoutPlanInput } from "@/lib/validation";
import type { ClientSource } from "@/lib/types";
import { IMPORT_FIELDS } from "@/lib/import/fields";
import type { ImportRecord, ImportSummary, SheetData } from "@/lib/import/types";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { MARKER_CATALOG } from "@/lib/catalog/markers";
import { MODALITIES } from "@/lib/catalog/modalities";
import { CADENCE_PRESETS } from "@/lib/catalog/plan-cadence";
import { callAi, isAiConfigured } from "@/lib/ai/provider";

function normPhone(v: string | null): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Re-validate and bulk-insert the records the importer built. Never trusts the
 * browser: every record goes back through the zod schemas, the plan limit caps
 * how many are written, and duplicates (vs the roster and within the batch) are
 * skipped with a reason.
 */
export async function bulkImportClientsAction(
  records: unknown,
  source: Extract<ClientSource, "excel" | "ai_import"> = "excel",
): Promise<ImportSummary> {
  await authed();

  const summary: ImportSummary = { imported: 0, skipped: [], errors: [] };

  // 1. Validate each record individually so one bad row doesn't sink the batch.
  const raw = Array.isArray(records) ? records : [];
  const valid: z.infer<typeof bulkImportSchema> = [];
  for (const r of raw) {
    const res = importRecordSchema.safeParse(r);
    if (res.success) {
      valid.push(res.data);
    } else {
      const row = typeof (r as { sourceRow?: unknown })?.sourceRow === "number" ? (r as { sourceRow: number }).sourceRow : -1;
      summary.errors.push({ row, msg: res.error.issues[0]?.message ?? "Invalid record" });
    }
  }

  // 2. Dedup against existing roster (email → phone → name).
  const existing = await listClients("all");
  const seenEmail = new Set(existing.map((c) => (c.email ?? "").toLowerCase()).filter(Boolean));
  const seenPhone = new Set(existing.map((c) => normPhone(c.phone)).filter(Boolean));
  const seenName = new Set(existing.map((c) => c.full_name.trim().toLowerCase()));

  // 3. Billing cap.
  const billing = await canAddClient();
  const remaining = billing.limit == null ? Infinity : Math.max(0, billing.limit - billing.count);

  const toInsert: {
    client: ClientInsert;
    metrics: BodyMetricInput[];
    markers: HealthMarkerInput[];
    goal: GoalInput | null;
    plans: WorkoutPlanInput[];
    row: number;
  }[] = [];

  for (const rec of valid) {
    const email = (rec.client.email ?? "").toLowerCase();
    const phone = normPhone(rec.client.phone);
    const name = rec.client.full_name.trim().toLowerCase();

    const dup =
      (email && seenEmail.has(email)) ||
      (phone && seenPhone.has(phone)) ||
      (!email && !phone && seenName.has(name));
    if (dup) {
      summary.skipped.push({ row: rec.sourceRow, reason: "duplicate" });
      continue;
    }

    if (toInsert.length >= remaining) {
      summary.skipped.push({ row: rec.sourceRow, reason: "plan limit" });
      continue;
    }

    // Claim keys so later batch rows can't re-duplicate.
    if (email) seenEmail.add(email);
    if (phone) seenPhone.add(phone);
    seenName.add(name);

    toInsert.push({
      client: {
        full_name: rec.client.full_name,
        sex: rec.client.sex,
        date_of_birth: rec.client.date_of_birth,
        phone: rec.client.phone,
        email: rec.client.email,
        notes: rec.client.notes,
        consent_given: true,
      },
      metrics: rec.metrics,
      markers: rec.markers,
      goal: rec.goal,
      plans: rec.plans ?? [],
      row: rec.sourceRow,
    });
  }

  if (toInsert.length === 0) return summary;

  // 4. Insert clients, then attach children keyed by the returned row order.
  let created;
  try {
    created = await bulkCreateClients(toInsert.map((t) => t.client), source);
  } catch {
    for (const t of toInsert) summary.errors.push({ row: t.row, msg: "Could not create client" });
    return summary;
  }
  summary.imported = created.length;

  const metrics: { clientId: string; input: BodyMetricInput }[] = [];
  const markers: { clientId: string; input: HealthMarkerInput }[] = [];
  const goals: { clientId: string; input: GoalInput }[] = [];
  const plans: { clientId: string; input: WorkoutPlanInput }[] = [];

  created.forEach((client, i) => {
    const src = toInsert[i];
    if (!src) return;
    for (const snap of src.metrics) metrics.push({ clientId: client.id, input: snap });
    for (const m of src.markers) markers.push({ clientId: client.id, input: m });
    if (src.goal) goals.push({ clientId: client.id, input: src.goal });
    // One active plan per modality: the first migrated plan of each modality is
    // marked active, later ones for that modality are kept but inactive.
    const activeModalities = new Set<string>();
    for (const plan of src.plans) {
      const isActive = !activeModalities.has(plan.modality);
      activeModalities.add(plan.modality);
      plans.push({ clientId: client.id, input: { ...plan, is_active: isActive } });
    }
  });

  // Child inserts are best-effort: a failure is reported but the client stays.
  await Promise.allSettled([
    bulkCreateBodyMetrics(metrics).catch(() => summary.errors.push({ row: -1, msg: "Some body metrics failed to import" })),
    bulkCreateHealthMarkers(markers).catch(() => summary.errors.push({ row: -1, msg: "Some health markers failed to import" })),
    bulkCreateGoals(goals).catch(() => summary.errors.push({ row: -1, msg: "Some goals failed to import" })),
    bulkCreateWorkoutPlans(plans).catch(() => summary.errors.push({ row: -1, msg: "Some workout plans failed to import" })),
  ]);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return summary;
}

// ---- AI mapping assist -----------------------------------------------------

const FIELD_KEYS = IMPORT_FIELDS.map((f) => f.key);
const mappingSchema = z.record(z.string(), z.string());

const SYSTEM = [
  "You map spreadsheet column headers from a personal trainer's client workbook to a fixed set of target field keys.",
  "Respond with ONLY a single JSON object — no prose, no markdown code fences.",
  'Shape: {"<exact source header>":"<target field key>"}. Omit a header entirely if none fits.',
  `Valid target field keys: ${FIELD_KEYS.join(", ")}.`,
  "Use each scalar key at most once (notes may repeat). Prefer the most specific key.",
].join(" ");

export interface SuggestMappingResult {
  mapping: Record<string, string>;
  error?: string;
}

/**
 * Ask the AI to map source headers → target field keys. Sends only the header
 * names and up to 3 sample rows. Returns {} when no API key is configured so
 * the dictionary heuristics stand on their own.
 */
export async function suggestImportMappingAction(input: {
  headers: string[];
  samples: string[][];
}): Promise<SuggestMappingResult> {
  await authed();

  if (!isAiConfigured()) return { mapping: {} };

  const headers = input.headers.slice(0, 60).map((h) => String(h).slice(0, 80));
  const samples = input.samples.slice(0, 3).map((r) => r.slice(0, 60).map((c) => String(c).slice(0, 40)));

  const prompt = [
    "Headers:",
    JSON.stringify(headers),
    "Sample rows (same column order):",
    JSON.stringify(samples),
  ].join("\n");

  const out = await callAi(SYSTEM, prompt, 1024);
  if ("error" in out) return { mapping: {}, error: out.error };

  const cleaned = out.text.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return { mapping: {}, error: "AI returned an unexpected response." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return { mapping: {}, error: "AI returned an unexpected response." };
  }

  const result = mappingSchema.safeParse(parsed);
  if (!result.success) return { mapping: {}, error: "AI returned an unexpected response." };

  // Keep only suggestions that name a real field key and a real header.
  const known = new Set(FIELD_KEYS);
  const headerSet = new Set(headers);
  const mapping: Record<string, string> = {};
  for (const [header, key] of Object.entries(result.data)) {
    if (headerSet.has(header) && known.has(key)) mapping[header] = key;
  }
  return { mapping };
}

// ---- AI full import -------------------------------------------------------
// Instead of a fixed wide-roster assumption, hand the whole workbook to the
// model and let it return structured client records directly — so it copes with
// measurement logs, one-tab-per-client workbooks, vertical intake forms, and
// generally messy sheets. The model NEVER writes anything: its output is
// re-validated here and in bulkImportClientsAction, then reviewed by the trainer
// before a single row is inserted.

const MAX_ROWS_PER_SHEET = 150;
const MAX_COLS = 40;
const MAX_PROMPT_CHARS = 60_000;

function serializeSheets(sheets: SheetData[]): { text: string; truncated: boolean } {
  let truncated = false;
  const payload = sheets.slice(0, 20).map((s) => {
    const rows = s.rows.slice(0, MAX_ROWS_PER_SHEET).map((r) => r.slice(0, MAX_COLS));
    if (s.rows.length > MAX_ROWS_PER_SHEET || s.rows.some((r) => r.length > MAX_COLS)) {
      truncated = true;
    }
    return { sheet: s.name, rows };
  });
  let text = JSON.stringify(payload);
  if (text.length > MAX_PROMPT_CHARS) {
    text = text.slice(0, MAX_PROMPT_CHARS);
    truncated = true;
  }
  return { text, truncated };
}

const MODALITY_KEYS_LIST = MODALITIES.map((m) => m.key).join(", ");
const PLAN_CADENCE_LIST = CADENCE_PRESETS.map((p) => p.key).join(", ");

const AI_IMPORT_SYSTEM = (todayISO: string) =>
  [
    "You migrate a personal trainer's existing data out of a messy spreadsheet workbook into our app. The workbook may hold client details, measurement/lab logs, AND the trainers' existing workout PROGRAMS — all of it must come across.",
    "",
    "FIRST, ANALYZE THE WHOLE WORKBOOK before emitting anything:",
    "- Look at EVERY worksheet (tab), every row and every column. Figure out what each sheet is: a client roster, one person's measurement log over time, a vertical intake form, or a workout program (days of exercises with sets/reps/weight).",
    "- Work out how the sheets relate. A workout program may live on its own tab and name the person it belongs to (a title cell, a 'Client:' label, or the tab name). Attach each program to the right person. If a program names no person but the workbook clearly concerns ONE client, attach it to that client.",
    "- Only after you understand the whole structure, decide how to shape the records below.",
    "",
    "Return ONLY a JSON array of client records — no prose, no markdown fences.",
    "One record per PERSON (not per row). If a sheet is one person's measurement log over time, emit ONE record with MANY dated entries in `metrics`. If each worksheet (tab) is a different person, emit one record per sheet.",
    "Capture EVERY dated row for a person: when body measurements OR a lab/blood panel repeat on several dates, emit a SEPARATE dated entry for each date — many entries in `metrics` and many in `markers`. Never collapse repeat panels to one date or keep only the latest.",
    "Record shape:",
    '{"sourceRow": <number>, "client": {"full_name": <string>, "sex": "male"|"female"|"other"|"unspecified", "date_of_birth": <"YYYY-MM-DD"|null>, "phone": <string|null>, "email": <string|null>, "notes": <string|null>}, "metrics": [{"measured_on": "YYYY-MM-DD", <metric_key>: <number>, ...}], "markers": [{"measured_on": "YYYY-MM-DD", "marker_key": <key>, "value": <number>, "unit": <string|null>}], "goal": {"title": <string>, "category": "health"|"workout", "target_value": <number|null>, "target_unit": <string|null>, "status": "active"}|null, "plans": [<plan>]}',
    "A `plan` (an existing workout program being migrated) has shape:",
    '{"name": <string>, "notes": <string|null>, "modality": <modality_key>, "cadence": <cadence_key>, "duration_weeks": <number>, "days": [{"day": <string e.g. "Day 1" or "Monday">, "title": <string>, "items": [{"exercise_name": <string>, "sets": <string>, "reps": <string>, "weight": <string>, "notes": <string>, "duration": <string>, "distance": <string>, "rounds": <string>, "tempo": <string>, "intensity": <string>}]}]}',
    `Valid metric keys: ${BODY_METRIC_FIELDS.map((f) => f.key).join(", ")}.`,
    `Valid marker_key values: ${MARKER_CATALOG.map((m) => m.key).join(", ")}. Use these only for genuine lab/vital markers; put anything else in notes.`,
    `Valid plan modality keys: ${MODALITY_KEYS_LIST}. Pick the one that best fits the program (barbell/dumbbell loads → strength; bodyweight → calisthenics; stretching/yoga → mobility; HIIT/circuits → conditioning; walking/steps/general health → longevity/lifestyle; runs/pace/distance → running). When unsure use strength.`,
    `Valid plan cadence keys: ${PLAN_CADENCE_LIST}. Pick the one matching how long the program runs (one week → weekly, 4 weeks/a month → monthly, 8 weeks → 2-months, 12 weeks → 3-months). Set duration_weeks to the program's length in weeks (default 1 if unknown).`,
    "Rules:",
    "- Combine separate first-name/last-name columns into full_name.",
    "- Parse every date to YYYY-MM-DD; read ambiguous d/m vs m/d as DAY-FIRST (India/EU).",
    "- Only include metric keys that have a value; omit empty ones. sourceRow = the 1-based spreadsheet row the person first appears on (or their index+1).",
    '- A blood-pressure cell like "120/80" becomes two markers: bp_systolic and bp_diastolic.',
    "- Columns that fit no field (medical conditions, medications, allergies, occupation, emergency contact, membership, assigned trainer, referred by, neck/calf/shoulder measurements, BMI) go into client.notes as \"Label: value\" segments joined by \" · \".",
    `- Every metrics/markers entry needs measured_on; if the sheet has no date, use "${todayISO}".`,
    "- SKIP total/average/subtotal/header/blank rows. A record must have a non-empty full_name; drop anyone without a real name.",
    "WORKOUT PROGRAMS (migrate them fully):",
    "- Turn each program into one entry in that person's `plans`. Group exercises under the day they belong to (a 'Day 1'/'Monday'/'Push'/'Upper' heading, a column per day, or a repeating block). Give the plan a sensible `name` (use the program's own title, else e.g. \"Imported strength plan\").",
    "- Every exercise is one item under its day. sets/reps/weight and the rest are FREE TEXT — keep ranges exactly as written (\"8-12\", \"3x10\", \"bodyweight\", \"RPE 8\", \"60kg\", \"30s\"). Put sets in `sets`, reps in `reps`, load in `weight`; time-based → `duration`, distance → `distance`, rounds/circuits → `rounds`, tempo → `tempo`, %1RM or RPE → `intensity`. Coaching cues/rest go in the item `notes`.",
    "- If the workbook is ONLY a workout program with no identifiable person, emit a single record whose client full_name is the program/person name if findable, otherwise skip it (return [] only if there is truly no person anywhere).",
    "- Omit the `plans` key (or use []) for anyone with no program. Never invent exercises that aren't in the sheet.",
  ].join("\n");

export interface AiImportResult {
  records: ImportRecord[];
  invalid: number;
  truncated: boolean;
  error?: string;
}

/**
 * Ask the configured AI provider to turn an uploaded workbook into structured
 * client records. `apiKey` is an optional per-request key (used for this call
 * only, never stored or logged); the server env key is the fallback. Returns
 * validated records for the Review step — nothing is written here.
 */
export async function aiImportAction(input: {
  sheets: SheetData[];
  apiKey?: string;
}): Promise<AiImportResult> {
  await authed();

  const empty = (error?: string): AiImportResult => ({ records: [], invalid: 0, truncated: false, error });

  if (!input.apiKey?.trim() && !isAiConfigured()) {
    return empty("AI import isn’t configured — no API key is set.");
  }
  if (!Array.isArray(input.sheets) || input.sheets.length === 0) {
    return empty("No sheet data to import.");
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const { text, truncated } = serializeSheets(input.sheets);

  const out = await callAi(AI_IMPORT_SYSTEM(todayISO), `Workbook (JSON):\n${text}`, 8192, input.apiKey);
  if ("error" in out) return empty(out.error);
  const raw = out.text;

  const cleaned = raw.replace(/```json\s*|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return empty("AI returned an unexpected response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return empty("AI returned an unexpected response.");
  }
  if (!Array.isArray(parsed)) return empty("AI returned an unexpected response.");

  const records: ImportRecord[] = [];
  let invalid = 0;
  parsed.slice(0, 1000).forEach((r, i) => {
    if (!r || typeof r !== "object") {
      invalid++;
      return;
    }
    const rec = r as { sourceRow?: unknown; client?: Record<string, unknown> };
    const withRow = {
      ...rec,
      sourceRow: typeof rec.sourceRow === "number" ? rec.sourceRow : i + 1,
      // The model doesn't emit consent (it's granted via the importer's consent
      // checkbox, re-affirmed in bulkImportClientsAction); stamp it so the shared
      // record schema — which requires it on the manual path — validates here too.
      client: { ...(rec.client ?? {}), consent_given: true },
    };
    const res = importRecordSchema.safeParse(withRow);
    if (res.success) records.push(res.data as unknown as ImportRecord);
    else invalid++;
  });

  if (records.length === 0) {
    return { records, invalid, truncated, error: "No importable client records were found in that file." };
  }
  return { records, invalid, truncated };
}
