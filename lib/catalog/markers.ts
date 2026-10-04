/**
 * Catalog of common health markers a trainer tracks.
 * Lives in app code (not the DB) so the common set can grow without a migration.
 * Trainers can also record ad-hoc markers via `custom_name` on a reading.
 */

export type MarkerCategory = "blood_sugar" | "lipids" | "vitamins" | "blood_pressure" | "other";

export interface MarkerDef {
  key: string;
  label: string;
  unit: string;
  category: MarkerCategory;
  /** Optional reference range shown as guidance (not a diagnosis). */
  refLow?: number;
  refHigh?: number;
}

export const MARKER_CATALOG: MarkerDef[] = [
  { key: "fasting_glucose", label: "Fasting blood sugar", unit: "mg/dL", category: "blood_sugar", refLow: 70, refHigh: 100 },
  { key: "hba1c", label: "HbA1c", unit: "%", category: "blood_sugar", refLow: 4, refHigh: 5.7 },
  { key: "total_cholesterol", label: "Total cholesterol", unit: "mg/dL", category: "lipids", refHigh: 200 },
  { key: "ldl", label: "LDL cholesterol", unit: "mg/dL", category: "lipids", refHigh: 100 },
  { key: "hdl", label: "HDL cholesterol", unit: "mg/dL", category: "lipids", refLow: 40 },
  { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", category: "lipids", refHigh: 150 },
  { key: "vitamin_d", label: "Vitamin D (25-OH)", unit: "ng/mL", category: "vitamins", refLow: 30, refHigh: 100 },
  { key: "vitamin_b12", label: "Vitamin B12", unit: "pg/mL", category: "vitamins", refLow: 200, refHigh: 900 },
  { key: "bp_systolic", label: "Blood pressure (systolic)", unit: "mmHg", category: "blood_pressure", refHigh: 120 },
  { key: "bp_diastolic", label: "Blood pressure (diastolic)", unit: "mmHg", category: "blood_pressure", refHigh: 80 },
];

export const MARKER_BY_KEY: Record<string, MarkerDef> = Object.fromEntries(
  MARKER_CATALOG.map((m) => [m.key, m]),
);

export const MARKER_KEYS = MARKER_CATALOG.map((m) => m.key);

/** Resolve a human label for either a catalog marker or a custom one. */
export function markerLabel(key: string, customName?: string | null): string {
  if (key === "custom") return customName?.trim() || "Custom marker";
  return MARKER_BY_KEY[key]?.label ?? key;
}
