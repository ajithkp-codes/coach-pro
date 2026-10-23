/**
 * SheetJS parsing (browser) + the pure row→record builder. `xlsx` is pulled in
 * via dynamic import so it stays out of the main bundle until a trainer actually
 * opens the importer.
 */
import { FIELD_BY_KEY } from "./fields";
import {
  ageToDob,
  cleanText,
  looksLikeEmail,
  parseDate,
  splitBloodPressure,
  toNumber,
  toSex,
} from "./normalize";
import type { BuildResult, ImportRecord, RecordFlag, SheetData, SkippedRow } from "./types";

/** Read every sheet of an uploaded workbook into string grids. */
export async function readWorkbook(file: File): Promise<SheetData[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as unknown[][];
    return { name, rows: rows.map((r) => r.map((c) => (c == null ? "" : String(c)))) };
  });
}

/** Index of the first row that has more than one non-empty cell. */
export function detectHeaderRow(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const filled = rows[i].filter((c) => c.trim() !== "").length;
    if (filled >= 1) return i;
  }
  return 0;
}

function normKey(record: ImportRecord): string {
  return (
    record.client.email?.toLowerCase() ||
    record.client.phone?.replace(/\D/g, "") ||
    record.client.full_name.toLowerCase()
  );
}

/**
 * Build normalized import records from data rows + a column→field mapping.
 * Rows with no usable name are set aside (`skipped`); soft issues (bad email,
 * duplicate-in-file) are reported as `flags` but still sent.
 */
export function buildRecords(
  dataRows: string[][],
  mapping: Record<number, string>,
  opts: { defaultDateISO: string; today?: Date; startRow?: number },
): BuildResult {
  const { defaultDateISO, today = new Date(), startRow = 0 } = opts;
  const records: ImportRecord[] = [];
  const skipped: SkippedRow[] = [];
  const flags: RecordFlag[] = [];
  const seen = new Set<string>();

  const entries = Object.entries(mapping)
    .map(([col, key]) => ({ col: Number(col), key }))
    .filter((e) => e.key);

  dataRows.forEach((row, idx) => {
    const sourceRow = startRow + idx;
    if (row.every((c) => c.trim() === "")) return; // blank line

    const client: ImportRecord["client"] = {
      full_name: "",
      sex: "unspecified",
      date_of_birth: null,
      phone: null,
      email: null,
      notes: null,
      consent_given: true,
    };
    const metrics: Record<string, string | number | null> = {};
    let hasMetric = false;
    const markers: ImportRecord["markers"] = [];
    let measuredOn = defaultDateISO;
    let goalTitle: string | null = null;
    let goalTarget: number | null = null;
    let goalUnit: string | null = null;
    const notesParts: string[] = [];
    const messages: string[] = [];

    for (const { col, key } of entries) {
      const raw = row[col];
      if (raw == null || String(raw).trim() === "") continue;
      const field = FIELD_BY_KEY[key];
      if (!field) continue;

      if (field.group === "Client") {
        switch (key) {
          case "full_name":
            client.full_name = cleanText(raw) ?? "";
            break;
          case "sex":
            client.sex = toSex(raw);
            break;
          case "age": {
            const dob = ageToDob(raw, today);
            if (dob && !client.date_of_birth) client.date_of_birth = dob;
            break;
          }
          case "date_of_birth": {
            const d = parseDate(raw);
            if (d) client.date_of_birth = d;
            break;
          }
          case "phone":
            client.phone = cleanText(raw);
            break;
          case "email":
            if (looksLikeEmail(raw)) {
              client.email = cleanText(raw);
            } else {
              notesParts.push(`Email: ${cleanText(raw)}`);
              messages.push("invalid email moved to notes");
            }
            break;
          case "notes":
            notesParts.push(cleanText(raw) ?? "");
            break;
        }
      } else if (field.group === "Body metrics") {
        if (key === "measured_on") {
          measuredOn = parseDate(raw) ?? defaultDateISO;
        } else {
          const n = toNumber(raw);
          if (n != null) {
            metrics[key] = n;
            hasMetric = true;
          }
        }
      } else if (field.group === "Health markers") {
        if (key === "bp_combined") {
          const { systolic, diastolic } = splitBloodPressure(raw);
          if (systolic != null) markers.push({ measured_on: measuredOn, marker_key: "bp_systolic", value: systolic, unit: "mmHg" });
          if (diastolic != null) markers.push({ measured_on: measuredOn, marker_key: "bp_diastolic", value: diastolic, unit: "mmHg" });
        } else {
          const n = toNumber(raw);
          if (n != null && field.markerKey) {
            markers.push({ measured_on: measuredOn, marker_key: field.markerKey, value: n, unit: field.unit ?? null });
          }
        }
      } else if (field.group === "Goal") {
        switch (key) {
          case "goal_title":
            goalTitle = cleanText(raw);
            break;
          case "goal_target_value":
            goalTarget = toNumber(raw);
            break;
          case "goal_target_unit":
            goalUnit = cleanText(raw);
            break;
        }
      }
    }

    if (!client.full_name) {
      skipped.push({ row: sourceRow, reason: "no name" });
      return;
    }

    client.notes = notesParts.filter(Boolean).join(" · ") || null;

    // Metric/marker measured_on was defaulted before the date column was read on
    // some rows; re-stamp markers with the resolved date.
    const resolvedMarkers = markers.map((m) => ({ ...m, measured_on: measuredOn }));

    const record: ImportRecord = {
      sourceRow,
      client,
      metrics: hasMetric ? { measured_on: measuredOn, ...metrics } : null,
      markers: resolvedMarkers,
      goal:
        goalTitle || goalTarget != null
          ? {
              title: goalTitle || "Target",
              category: "health",
              target_value: goalTarget,
              target_unit: goalUnit,
              status: "active",
            }
          : null,
    };

    const dupKey = normKey(record);
    if (seen.has(dupKey)) messages.push("duplicate in file");
    seen.add(dupKey);

    if (messages.length) flags.push({ row: sourceRow, messages });
    records.push(record);
  });

  return { records, skipped, flags };
}
