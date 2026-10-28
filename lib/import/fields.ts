/**
 * Target-field catalog for the Excel client importer. Each entry is something a
 * column in the trainer's sheet can map onto. Labels reuse the metric/marker
 * catalogs so the importer and the rest of the app stay in sync. `synonyms` are
 * the header spellings we auto-match against (see column-match.ts).
 */
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { MARKER_CATALOG } from "@/lib/catalog/markers";

export type FieldGroup = "Client" | "Body metrics" | "Health markers" | "Goal";
export type FieldKind = "text" | "number" | "date" | "enum";

export interface ImportField {
  key: string;
  label: string;
  group: FieldGroup;
  kind: FieldKind;
  synonyms: string[];
  /** Display unit for metric/marker fields. */
  unit?: string;
  /** marker_key this field writes to (health-marker fields only). */
  markerKey?: string;
}

// Extra header spellings per metric/marker key, on top of the catalog label.
const METRIC_SYNONYMS: Record<string, string[]> = {
  weight_kg: ["weight", "wt", "body weight", "mass", "weight kg", "current weight"],
  height_cm: ["height", "ht", "tall", "height cm"],
  body_fat_pct: ["body fat", "bf", "bf%", "fat", "fat percent", "fat percentage", "body fat percent"],
  chest_cm: ["chest", "bust"],
  waist_cm: ["waist", "tummy", "belly", "abdomen"],
  hips_cm: ["hips", "hip"],
  arm_cm: ["arm", "arms", "bicep", "biceps", "upper arm"],
  thigh_cm: ["thigh", "thighs", "quad", "quads"],
};

const MARKER_SYNONYMS: Record<string, string[]> = {
  fasting_glucose: ["fasting glucose", "glucose", "fasting sugar", "fbs", "blood sugar", "sugar"],
  hba1c: ["hba1c", "a1c", "glycated hemoglobin", "glycated haemoglobin"],
  total_cholesterol: ["cholesterol", "total cholesterol", "tc"],
  ldl: ["ldl", "ldl cholesterol", "bad cholesterol"],
  hdl: ["hdl", "hdl cholesterol", "good cholesterol"],
  triglycerides: ["triglycerides", "tg", "trigs"],
  vitamin_d: ["vitamin d", "vit d", "vitd", "25 oh"],
  vitamin_b12: ["vitamin b12", "b12", "vit b12"],
  bp_systolic: ["systolic", "sbp", "bp systolic"],
  bp_diastolic: ["diastolic", "dbp", "bp diastolic"],
};

const CLIENT_FIELDS: ImportField[] = [
  { key: "full_name", label: "Full name", group: "Client", kind: "text", synonyms: ["name", "client name", "full name", "client", "member", "member name", "customer"] },
  { key: "sex", label: "Sex", group: "Client", kind: "enum", synonyms: ["sex", "gender", "m/f"] },
  { key: "age", label: "Age (→ year of birth)", group: "Client", kind: "number", synonyms: ["age", "age yrs", "years"] },
  { key: "date_of_birth", label: "Date of birth", group: "Client", kind: "date", synonyms: ["dob", "date of birth", "birth date", "birthday", "d.o.b"] },
  { key: "phone", label: "Phone", group: "Client", kind: "text", synonyms: ["phone", "mobile", "contact", "phone number", "mobile number", "cell", "whatsapp", "contact number"] },
  { key: "email", label: "Email", group: "Client", kind: "text", synonyms: ["email", "e mail", "mail", "email address", "email id"] },
  { key: "notes", label: "Notes", group: "Client", kind: "text", synonyms: ["notes", "remarks", "comment", "comments", "medical", "medical history", "injuries", "conditions", "occupation", "address", "medical notes"] },
];

const METRIC_FIELDS: ImportField[] = [
  { key: "measured_on", label: "Measurement date", group: "Body metrics", kind: "date", synonyms: ["date", "measured on", "measurement date", "assessment date", "last updated", "updated on", "last measured"] },
  ...BODY_METRIC_FIELDS.map<ImportField>((f) => ({
    key: f.key,
    label: f.label,
    group: "Body metrics",
    kind: "number",
    unit: f.unit,
    synonyms: METRIC_SYNONYMS[f.key] ?? [f.label.toLowerCase()],
  })),
];

const MARKER_FIELDS: ImportField[] = [
  // Combined "120/80" blood-pressure cell, split on import.
  { key: "bp_combined", label: "Blood pressure (120/80)", group: "Health markers", kind: "text", synonyms: ["bp", "blood pressure", "b.p", "bp reading"] },
  ...MARKER_CATALOG.map<ImportField>((m) => ({
    key: m.key,
    label: m.label,
    group: "Health markers",
    kind: "number",
    unit: m.unit,
    markerKey: m.key,
    synonyms: MARKER_SYNONYMS[m.key] ?? [m.label.toLowerCase()],
  })),
];

const GOAL_FIELDS: ImportField[] = [
  { key: "goal_title", label: "Goal", group: "Goal", kind: "text", synonyms: ["goal", "goals", "objective", "aim", "target goal"] },
  { key: "goal_target_value", label: "Goal target value", group: "Goal", kind: "number", synonyms: ["target weight", "goal weight", "target value", "target wt", "goal target"] },
  { key: "goal_target_unit", label: "Goal target unit", group: "Goal", kind: "text", synonyms: ["target unit", "goal unit"] },
];

export const IMPORT_FIELDS: ImportField[] = [
  ...CLIENT_FIELDS,
  ...METRIC_FIELDS,
  ...MARKER_FIELDS,
  ...GOAL_FIELDS,
];

export const FIELD_BY_KEY: Record<string, ImportField> = Object.fromEntries(
  IMPORT_FIELDS.map((f) => [f.key, f]),
);

export const FIELD_GROUPS: FieldGroup[] = ["Client", "Body metrics", "Health markers", "Goal"];

/** Fields that only make sense once per client (scalar). `notes` is additive. */
export const METRIC_KEYS = BODY_METRIC_FIELDS.map((f) => f.key);
