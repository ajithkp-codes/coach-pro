/**
 * Batched inserts for the bulk Excel importer. Each helper injects
 * `trainer_id` from the authenticated session and relies on RLS to keep every
 * write tenant-scoped, mirroring the single-row inserts in the sibling data
 * modules.
 */
import { authed } from "./session";
import type { Client } from "@/lib/types";
import type { BodyMetricInput, GoalInput, HealthMarkerInput } from "@/lib/validation";
import { MARKER_BY_KEY } from "@/lib/catalog/markers";

export interface ClientInsert {
  full_name: string;
  sex: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  consent_given: boolean;
}

/**
 * Insert many clients at once. Postgres returns the inserted rows in the order
 * of the VALUES list for a single INSERT, so the returned array lines up with
 * `inputs` by index — callers depend on that to attach child rows.
 */
export async function bulkCreateClients(inputs: ClientInsert[]): Promise<Client[]> {
  if (inputs.length === 0) return [];
  const { supabase, trainerId } = await authed();
  const now = new Date().toISOString();
  const rows = inputs.map((c) => ({
    trainer_id: trainerId,
    full_name: c.full_name,
    sex: c.sex,
    date_of_birth: c.date_of_birth,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    consent_given: c.consent_given,
    consent_at: c.consent_given ? now : null,
  }));
  const { data, error } = await supabase.from("clients").insert(rows).select("*");
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function bulkCreateBodyMetrics(
  entries: { clientId: string; input: BodyMetricInput }[],
): Promise<void> {
  if (entries.length === 0) return;
  const { supabase, trainerId } = await authed();
  const rows = entries.map((e) => ({ trainer_id: trainerId, client_id: e.clientId, ...e.input }));
  const { error } = await supabase.from("body_metrics").insert(rows);
  if (error) throw error;
}

export async function bulkCreateHealthMarkers(
  entries: { clientId: string; input: HealthMarkerInput }[],
): Promise<void> {
  if (entries.length === 0) return;
  const { supabase, trainerId } = await authed();
  const rows = entries.map((e) => ({
    trainer_id: trainerId,
    client_id: e.clientId,
    ...e.input,
    unit: e.input.unit ?? MARKER_BY_KEY[e.input.marker_key]?.unit ?? null,
  }));
  const { error } = await supabase.from("health_markers").insert(rows);
  if (error) throw error;
}

export async function bulkCreateGoals(
  entries: { clientId: string; input: GoalInput }[],
): Promise<void> {
  if (entries.length === 0) return;
  const { supabase, trainerId } = await authed();
  const rows = entries.map((e) => ({
    trainer_id: trainerId,
    client_id: e.clientId,
    ...e.input,
    achieved_at: e.input.status === "achieved" ? new Date().toISOString() : null,
  }));
  const { error } = await supabase.from("goals").insert(rows);
  if (error) throw error;
}
