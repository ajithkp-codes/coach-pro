import { z } from "zod";
import { BODY_METRIC_KEYS } from "@/lib/catalog/metrics";
import { MARKER_KEYS } from "@/lib/catalog/markers";

/** Coerce an optional number field from a form: "" → undefined, else number. */
const optionalNumber = z
  .union([z.string(), z.number()])
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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
export type HealthMarkerInput = z.infer<typeof healthMarkerSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
