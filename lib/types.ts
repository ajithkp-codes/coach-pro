/** Domain types mirroring the Postgres schema (supabase/migrations/0001_init.sql). */

import type { Modality } from "@/lib/catalog/modalities";

export type ClientStatus = "active" | "archived";

/** How a client entered the roster (see migration 0018). */
export type ClientSource = "manual" | "excel" | "ai_import";
export type Sex = "male" | "female" | "other" | "unspecified";
export type GoalCategory = "health" | "workout";
export type GoalStatus = "active" | "achieved" | "paused" | "dropped";

export interface Trainer {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  is_admin: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  trainer_id: string;
  full_name: string;
  sex: Sex;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: ClientStatus;
  consent_given: boolean;
  consent_at: string | null;
  log_token: string | null;
  log_token_created_at: string | null;
  source: ClientSource;
  created_at: string;
  updated_at: string;
}

export interface BodyMetric {
  id: string;
  trainer_id: string;
  client_id: string;
  measured_on: string;
  weight_kg: number | null;
  height_cm: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthMarker {
  id: string;
  trainer_id: string;
  client_id: string;
  measured_on: string;
  marker_key: string;
  custom_name: string | null;
  value: number;
  unit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  metric_key: string | null;
  start_value: number | null;
  target_value: number | null;
  target_unit: string | null;
  target_date: string | null;
  status: GoalStatus;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientPhoto {
  id: string;
  trainer_id: string;
  client_id: string;
  storage_path: string;
  taken_on: string;
  caption: string | null;
  created_at: string;
}

/** A photo row with a short-lived signed URL for display. */
export interface ClientPhotoWithUrl extends ClientPhoto {
  url: string | null;
}

export interface Reminder {
  id: string;
  trainer_id: string;
  client_id: string | null;
  title: string;
  note: string | null;
  due_on: string;
  done: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Reminder with the related client's name resolved (for cross-client views). */
export interface ReminderWithClient extends Reminder {
  client_name: string | null;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
/** 'event' = a one-off (consult, call); 'attendance' = a missed plan session. */
export type AppointmentKind = "event" | "attendance";

export interface Appointment {
  id: string;
  trainer_id: string;
  client_id: string | null;
  kind: AppointmentKind;
  starts_at: string;
  duration_min: number;
  title: string | null;
  location: string | null;
  status: AppointmentStatus;
  notes: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Appointment with the related client's name resolved (for calendar/agenda views). */
export interface AppointmentWithClient extends Appointment {
  client_name: string | null;
}

export type ReportPeriod = "3m" | "6m" | "12m" | "all";

export interface ProgressReport {
  id: string;
  trainer_id: string;
  client_id: string;
  token: string;
  title: string | null;
  period: ReportPeriod;
  include_photos: boolean;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
  created_at: string;
}

export type Plan = "free" | "pro" | "studio";
export type SubStatus = "active" | "inactive" | "past_due" | "cancelled";

export interface Subscription {
  trainer_id: string;
  plan: Plan;
  status: SubStatus;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  current_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedFile {
  id: string;
  trainer_id: string;
  client_id: string;
  storage_path: string;
  original_name: string;
  content_type: string | null;
  size_bytes: number | null;
  title: string | null;
  token: string;
  expires_at: string | null;
  revoked: boolean;
  download_count: number;
  created_at: string;
}

/** Extra metrics a logged set carries beyond the real columns (rounds, calories,
 * avg HR, tempo, side, progression level…), keyed by modality LogField key. */
export type SetMetrics = Record<string, string | number | null>;

export interface WorkoutSet {
  id: string;
  trainer_id: string;
  client_id: string;
  session_id: string;
  position: number;
  exercise_name: string;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  // Cross-modality metrics (0015): real columns for the common two, jsonb for the rest.
  duration_sec: number | null;
  distance_m: number | null;
  metrics: SetMetrics;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A planned line. `exercise_name`/`sets`/`reps`/`weight`/`notes` are the original
 * strength fields; the rest are optional free-text slots other modalities use
 * (which plan columns show is driven by lib/catalog/modalities.ts). */
export interface PlanItem {
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
  duration?: string;
  distance?: string;
  rounds?: string;
  tempo?: string;
  intensity?: string;
}

export interface PlanDay {
  day: string; // e.g. "Mon" or "Day 1"
  title: string; // e.g. "Push"
  items: PlanItem[];
  /** Per-day override of the plan's modality; falls back to the plan's when unset. */
  modality?: Modality;
}

/** How long a weekly plan runs; the week repeats for `duration_weeks` (see
 *  lib/catalog/plan-cadence.ts). */
export type PlanCadence = "weekly" | "biweekly" | "monthly" | "2-months" | "3-months" | "custom";

export interface WorkoutPlan {
  id: string;
  trainer_id: string;
  client_id: string;
  name: string;
  notes: string | null;
  is_active: boolean;
  modality: Modality;
  /** The repeating weekly structure. */
  days: PlanDay[];
  /** Scheduling: the week repeats for `duration_weeks`, optionally from `starts_on`. */
  cadence: PlanCadence;
  duration_weeks: number;
  starts_on: string | null;
  /** Public share link (null = never shared); toggled off with share_revoked. */
  share_token: string | null;
  share_revoked: boolean;
  share_view_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  trainer_id: string;
  client_id: string;
  performed_on: string;
  title: string | null;
  duration_min: number | null;
  modality: Modality;
  notes: string | null;
  /** When logged against a plan: the plan, the day key fulfilled, and which week. */
  plan_id: string | null;
  plan_day: string | null;
  week_number: number | null;
  created_at: string;
  updated_at: string;
}

/** A session with its sets attached, for display. */
export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: WorkoutSet[];
}

// ---- Nutrition ----
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

/** One food line inside a planned meal (numbers kept as free text, like plan reps). */
export interface DietPlanFoodItem {
  food: string;
  qty: string;
  calories: string;
  protein: string;
  notes: string;
}

export interface DietPlanMeal {
  meal: MealType;
  time: string; // e.g. "08:00" or "Post-workout"
  items: DietPlanFoodItem[];
}

export interface DietPlanDay {
  day: string; // e.g. "Mon" or "Every day"
  title: string; // e.g. "Training day"
  meals: DietPlanMeal[];
}

export interface DietPlan {
  id: string;
  trainer_id: string;
  client_id: string;
  name: string;
  notes: string | null;
  is_active: boolean;
  target_calories: number | null;
  target_protein_g: number | null;
  days: DietPlanDay[];
  storage_path: string | null;
  original_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

/** A plan with a short-lived signed URL for its attachment (if any). */
export interface DietPlanWithUrl extends DietPlan {
  attachment_url: string | null;
}

export interface DietLogEntry {
  id: string;
  trainer_id: string;
  client_id: string;
  log_id: string;
  position: number;
  meal: MealType;
  eaten_at: string | null;
  food: string;
  quantity: string | null;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
  created_at: string;
}

export interface DietLog {
  id: string;
  trainer_id: string;
  client_id: string;
  logged_on: string;
  water_ml: number | null;
  notes: string | null;
  source: "trainer" | "client";
  created_at: string;
  updated_at: string;
}

/** A day's log with its food entries attached, for display. */
export interface DietLogWithEntries extends DietLog {
  entries: DietLogEntry[];
}

/** One food line inside a client submission (JSONB; same shape as a log entry). */
export interface DietSubmissionEntry {
  meal: MealType;
  eaten_at: string | null;
  food: string;
  quantity: string | null;
  calories: number | null;
  protein_g: number | null;
  notes: string | null;
}

/** A day the client submitted via their logging link, awaiting trainer review. */
export interface DietSubmission {
  id: string;
  trainer_id: string;
  client_id: string;
  logged_on: string;
  water_ml: number | null;
  notes: string | null;
  entries: DietSubmissionEntry[];
  created_at: string;
  updated_at: string;
}
