/** Domain types mirroring the Postgres schema (supabase/migrations/0001_init.sql). */

export type ClientStatus = "active" | "archived";
export type Sex = "male" | "female" | "other" | "unspecified";
export type GoalCategory = "health" | "workout";
export type GoalStatus = "active" | "achieved" | "paused" | "dropped";

export interface Trainer {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
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

export type Plan = "free" | "pro";
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
  notes: string | null;
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
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A session with its sets attached, for display. */
export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: WorkoutSet[];
}
