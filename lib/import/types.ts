/** Shared types for the Excel client importer. */
import type { WorkoutPlanInput } from "@/lib/validation";

/** One parsed worksheet: a name and a grid of stringified cells. */
export interface SheetData {
  name: string;
  rows: string[][];
}

/**
 * A single client's worth of data as built in the browser from one spreadsheet
 * row. Shapes mirror the zod schemas in `lib/validation.ts` (the server
 * re-validates these before anything is written).
 */
export interface ImportRecord {
  sourceRow: number;
  client: {
    full_name: string;
    sex: "male" | "female" | "other" | "unspecified";
    date_of_birth: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    consent_given: boolean;
  };
  /** Dated body-metric snapshots. One element for a roster row; many for a log. */
  metrics: Record<string, string | number | null>[];
  markers: { measured_on: string; marker_key: string; value: number; unit: string | null }[];
  goal: { title: string; category: "health" | "workout"; target_value: number | null; target_unit: string | null; status: "active" } | null;
  /** Existing training program(s) migrated alongside the client (AI import only). */
  plans?: WorkoutPlanInput[];
}

/** A row the browser builder set aside before sending (e.g. no name). */
export interface SkippedRow {
  row: number;
  reason: string;
}

/** Non-fatal observations about a record, shown in the review table. */
export interface RecordFlag {
  row: number;
  messages: string[];
}

export interface BuildResult {
  records: ImportRecord[];
  skipped: SkippedRow[];
  flags: RecordFlag[];
}

/** What the server action returns after attempting the import. */
export interface ImportSummary {
  imported: number;
  skipped: { row: number; reason: string }[];
  errors: { row: number; msg: string }[];
}
