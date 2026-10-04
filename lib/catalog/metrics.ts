/**
 * Body-metric fields tracked per dated measurement.
 * Used to render the metrics form, history table, and the "metric-linked goal" picker.
 */

export interface MetricField {
  key: string;
  label: string;
  unit: string;
  /** Lower value is better (e.g. body fat, waist). Used for goal-progress direction. */
  lowerIsBetter?: boolean;
}

export const BODY_METRIC_FIELDS: MetricField[] = [
  { key: "weight_kg", label: "Weight", unit: "kg", lowerIsBetter: true },
  { key: "height_cm", label: "Height", unit: "cm" },
  { key: "body_fat_pct", label: "Body fat", unit: "%", lowerIsBetter: true },
  { key: "chest_cm", label: "Chest", unit: "cm" },
  { key: "waist_cm", label: "Waist", unit: "cm", lowerIsBetter: true },
  { key: "hips_cm", label: "Hips", unit: "cm" },
  { key: "arm_cm", label: "Arm", unit: "cm" },
  { key: "thigh_cm", label: "Thigh", unit: "cm" },
];

export const METRIC_BY_KEY: Record<string, MetricField> = Object.fromEntries(
  BODY_METRIC_FIELDS.map((f) => [f.key, f]),
);

export const BODY_METRIC_KEYS = BODY_METRIC_FIELDS.map((f) => f.key);
