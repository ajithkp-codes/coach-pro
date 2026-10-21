import { z } from "zod";
import { BODY_METRIC_KEYS } from "@/lib/catalog/metrics";
import { MARKER_KEYS } from "@/lib/catalog/markers";

/** Coerce an optional number field from a form: "" → undefined, else number. */
const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined || v === null ? null : Number(v)))
  .refine((v) => v === null || !Number.isNaN(v), { message: "Must be a number" });

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

// ---- Auth ----
export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Your name is required").max(120),
  businessName: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// ---- Client ----
export const clientSchema = z.object({
  full_name: z.string().trim().min(1, "Client name is required").max(120),
  sex: z.enum(["male", "female", "other", "unspecified"]).default("unspecified"),
  date_of_birth: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  phone: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
  email: z
    .union([z.string().trim().email("Enter a valid email"), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  notes: optionalText,
  consent_given: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true" || v === "on"),
});

// ---- Body metrics ----
export const bodyMetricSchema = z
  .object({
    measured_on: z.string().min(1, "Date is required"),
    weight_kg: optionalNumber,
    height_cm: optionalNumber,
    body_fat_pct: optionalNumber,
    chest_cm: optionalNumber,
    waist_cm: optionalNumber,
    hips_cm: optionalNumber,
    arm_cm: optionalNumber,
    thigh_cm: optionalNumber,
    notes: optionalText,
  })
  .refine(
    (d) => BODY_METRIC_KEYS.some((k) => d[k as keyof typeof d] !== null && d[k as keyof typeof d] !== undefined),
    { message: "Enter at least one measurement", path: ["weight_kg"] },
  );

// ---- Health markers ----
export const healthMarkerSchema = z
  .object({
    measured_on: z.string().min(1, "Date is required"),
    marker_key: z.enum(["custom", ...MARKER_KEYS] as [string, ...string[]]),
    custom_name: z.string().trim().max(120).optional().transform((v) => (v ? v : null)),
    value: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => !Number.isNaN(v), { message: "Enter a numeric value" }),
    unit: z.string().trim().max(20).optional().transform((v) => (v ? v : null)),
    notes: optionalText,
  })
  .refine((d) => d.marker_key !== "custom" || !!d.custom_name, {
    message: "Name the custom marker",
    path: ["custom_name"],
  });

// ---- Goals ----
export const goalSchema = z.object({
  title: z.string().trim().min(1, "Goal title is required").max(160),
  description: optionalText,
  category: z.enum(["health", "workout"]).default("health"),
  metric_key: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null)),
  start_value: optionalNumber,
  target_value: optionalNumber,
  target_unit: z.string().trim().max(20).optional().transform((v) => (v ? v : null)),
  target_date: z.string().optional().transform((v) => (v ? v : null)),
  status: z.enum(["active", "achieved", "paused", "dropped"]).default("active"),
});

// ---- Training logs ----
export const workoutSetSchema = z.object({
  exercise_name: z.string().trim().min(1, "Exercise name is required").max(120),
  reps: optionalNumber,
  weight_kg: optionalNumber,
  rpe: optionalNumber.refine((v) => v === null || (v >= 0 && v <= 10), {
    message: "RPE must be between 0 and 10",
  }),
  notes: optionalText,
});

export const workoutSessionSchema = z.object({
  performed_on: z.string().min(1, "Date is required"),
  title: z.string().trim().max(120).optional().transform((v) => (v ? v : null)),
  duration_min: optionalNumber,
  notes: optionalText,
  sets: z.array(workoutSetSchema).max(200).default([]),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type WorkoutSessionInput = z.infer<typeof workoutSessionSchema>;

// ---- Weekly workout plan (targets are free text so ranges like "8-12" work) ----
const planText = (max: number) =>
  z.string().trim().max(max).optional().default("").transform((v) => v ?? "");

export const planItemSchema = z.object({
  exercise_name: z.string().trim().min(1, "Exercise name is required").max(120),
  sets: planText(20),
  reps: planText(20),
  weight: planText(40),
  notes: planText(200),
});

export const planDaySchema = z.object({
  day: z.string().trim().min(1).max(24),
  title: planText(120),
  items: z.array(planItemSchema).max(40),
});

export const workoutPlanSchema = z.object({
  name: z.string().trim().min(1, "Give the plan a name").max(120),
  notes: optionalText,
  is_active: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on"),
  days: z.array(planDaySchema).max(14).default([]),
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

// ---- Nutrition: diet plan (per-item numbers are free text so "approx" works) ----
const mealEnum = z.enum(["breakfast", "lunch", "dinner", "snack", "other"]);

export const dietPlanFoodSchema = z.object({
  food: z.string().trim().min(1, "Food is required").max(160),
  qty: planText(40),
  calories: planText(20),
  protein: planText(20),
  notes: planText(200),
});

export const dietPlanMealSchema = z.object({
  meal: mealEnum.default("other"),
  time: planText(40),
  items: z.array(dietPlanFoodSchema).max(40),
});

export const dietPlanDaySchema = z.object({
  day: z.string().trim().min(1).max(24),
  title: planText(120),
  meals: z.array(dietPlanMealSchema).max(10),
});

export const dietPlanSchema = z.object({
  name: z.string().trim().min(1, "Give the plan a name").max(120),
  notes: optionalText,
  is_active: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on"),
  target_calories: optionalNumber,
  target_protein_g: optionalNumber,
  days: z.array(dietPlanDaySchema).max(14).default([]),
  // Optional attachment (uploaded browser-direct to Storage first).
  storage_path: z.string().trim().max(400).optional().transform((v) => (v ? v : null)),
  original_name: z.string().trim().max(260).optional().transform((v) => (v ? v : null)),
  content_type: z.string().trim().max(160).optional().transform((v) => (v ? v : null)),
  size_bytes: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v))),
});

export type DietPlanInput = z.infer<typeof dietPlanSchema>;

// ---- Nutrition: intake log (what the client actually ate on a day) ----
export const dietEntrySchema = z.object({
  meal: mealEnum.default("other"),
  eaten_at: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
  food: z.string().trim().min(1, "Food is required").max(160),
  quantity: z.string().trim().max(80).optional().transform((v) => (v ? v : null)),
  calories: optionalNumber,
  protein_g: optionalNumber,
  notes: optionalText,
});

export const dietLogSchema = z.object({
  logged_on: z.string().min(1, "Date is required"),
  water_ml: optionalNumber,
  notes: optionalText,
  entries: z.array(dietEntrySchema).max(60).default([]),
});

export type DietEntryInput = z.infer<typeof dietEntrySchema>;
export type DietLogInput = z.infer<typeof dietLogSchema>;

// ---- Progress photos (metadata; the file is uploaded browser-direct to Storage) ----
export const photoMetaSchema = z.object({
  storage_path: z.string().trim().min(1).max(400),
  taken_on: z.string().min(1, "Date is required"),
  caption: z.string().trim().max(200).optional().transform((v) => (v ? v : null)),
});

export type PhotoMetaInput = z.infer<typeof photoMetaSchema>;

// ---- Shared files (metadata; the file is uploaded browser-direct to Storage) ----
export const sharedFileMetaSchema = z.object({
  storage_path: z.string().trim().min(1).max(400),
  original_name: z.string().trim().min(1).max(260),
  content_type: z.string().trim().max(160).optional().transform((v) => (v ? v : null)),
  size_bytes: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v))),
  title: z.string().trim().max(160).optional().transform((v) => (v ? v : null)),
  expires_in_days: z.enum(["7", "30", "90", "never"]).default("30"),
});

export type SharedFileMetaInput = z.infer<typeof sharedFileMetaSchema>;

// ---- Reminders ----
export const reminderSchema = z.object({
  title: z.string().trim().min(1, "What's the reminder?").max(160),
  note: optionalText,
  due_on: z.string().min(1, "Pick a due date"),
  client_id: z
    .string()
    .optional()
    .transform((v) => (v && v !== "none" ? v : null)),
});

export type ReminderInput = z.infer<typeof reminderSchema>;

// ---- Progress reports ----
export const reportSchema = z.object({
  title: z.string().trim().max(160).optional().transform((v) => (v ? v : null)),
  period: z.enum(["3m", "6m", "12m", "all"]).default("6m"),
  include_photos: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on"),
  expires_in_days: z.enum(["7", "30", "90", "never"]).default("30"),
});

export type ReportInput = z.infer<typeof reportSchema>;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
export type HealthMarkerInput = z.infer<typeof healthMarkerSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
