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
  type ClientInsert,
} from "@/lib/data/import";
import { bulkImportSchema, importRecordSchema } from "@/lib/validation";
import type { BodyMetricInput, GoalInput, HealthMarkerInput } from "@/lib/validation";
import { IMPORT_FIELDS } from "@/lib/import/fields";
import type { ImportSummary } from "@/lib/import/types";

function normPhone(v: string | null): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Re-validate and bulk-insert the records the importer built. Never trusts the
 * browser: every record goes back through the zod schemas, the plan limit caps
 * how many are written, and duplicates (vs the roster and within the batch) are
 * skipped with a reason.
 */
export async function bulkImportClientsAction(records: unknown): Promise<ImportSummary> {
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
    metrics: BodyMetricInput | null;
    markers: HealthMarkerInput[];
    goal: GoalInput | null;
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
      row: rec.sourceRow,
    });
  }

  if (toInsert.length === 0) return summary;

  // 4. Insert clients, then attach children keyed by the returned row order.
  let created;
  try {
    created = await bulkCreateClients(toInsert.map((t) => t.client));
  } catch {
    for (const t of toInsert) summary.errors.push({ row: t.row, msg: "Could not create client" });
    return summary;
  }
  summary.imported = created.length;

  const metrics: { clientId: string; input: BodyMetricInput }[] = [];
  const markers: { clientId: string; input: HealthMarkerInput }[] = [];
  const goals: { clientId: string; input: GoalInput }[] = [];

  created.forEach((client, i) => {
    const src = toInsert[i];
    if (!src) return;
    if (src.metrics) metrics.push({ clientId: client.id, input: src.metrics });
    for (const m of src.markers) markers.push({ clientId: client.id, input: m });
    if (src.goal) goals.push({ clientId: client.id, input: src.goal });
  });

  // Child inserts are best-effort: a failure is reported but the client stays.
  await Promise.allSettled([
    bulkCreateBodyMetrics(metrics).catch(() => summary.errors.push({ row: -1, msg: "Some body metrics failed to import" })),
    bulkCreateHealthMarkers(markers).catch(() => summary.errors.push({ row: -1, msg: "Some health markers failed to import" })),
    bulkCreateGoals(goals).catch(() => summary.errors.push({ row: -1, msg: "Some goals failed to import" })),
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
 * Ask Claude to map source headers → target field keys. Sends only the header
 * names and up to 3 sample rows. Returns {} when no API key is configured so
 * the dictionary heuristics stand on their own.
 */
export async function suggestImportMappingAction(input: {
  headers: string[];
  samples: string[][];
}): Promise<SuggestMappingResult> {
  await authed();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { mapping: {} };

  const headers = input.headers.slice(0, 60).map((h) => String(h).slice(0, 80));
  const samples = input.samples.slice(0, 3).map((r) => r.slice(0, 60).map((c) => String(c).slice(0, 40)));

  const prompt = [
    "Headers:",
    JSON.stringify(headers),
    "Sample rows (same column order):",
    JSON.stringify(samples),
  ].join("\n");

  let text: string;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { mapping: {}, error: `AI assist unavailable (${res.status}).` };
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    text = data.content?.find((b) => b.type === "text")?.text ?? "";
  } catch {
    return { mapping: {}, error: "Couldn’t reach the AI service." };
  }

  const cleaned = text.replace(/```json\s*|```/g, "").trim();
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
