import { authed } from "./session";
import type { Client, ClientStatus } from "@/lib/types";
import type { ClientInput } from "@/lib/validation";

export interface ClientWithCounts extends Client {
  metrics_count: number;
  markers_count: number;
  goals_count: number;
}

/** List the trainer's clients (RLS guarantees own-tenant only). */
export async function listClients(
  status: ClientStatus | "all" = "active",
): Promise<Client[]> {
  const { supabase } = await authed();
  let query = supabase
    .from("clients")
    .select("*")
    .order("full_name", { ascending: true });
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClient(clientId: string): Promise<Client | null> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return (data as Client) ?? null;
}

export async function createClientRecord(input: ClientInput): Promise<Client> {
  const { supabase, trainerId } = await authed();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      trainer_id: trainerId,
      full_name: input.full_name,
      sex: input.sex,
      date_of_birth: input.date_of_birth,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      consent_given: input.consent_given,
      consent_at: input.consent_given ? new Date().toISOString() : null,
      source: "manual",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClientRecord(
  clientId: string,
  input: ClientInput,
): Promise<Client> {
  const { supabase } = await authed();
  // Preserve the original consent timestamp if consent was already given.
  const existing = await getClient(clientId);
  const consent_at = input.consent_given
    ? existing?.consent_at ?? new Date().toISOString()
    : null;
  const { data, error } = await supabase
    .from("clients")
    .update({
      full_name: input.full_name,
      sex: input.sex,
      date_of_birth: input.date_of_birth,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      consent_given: input.consent_given,
      consent_at,
    })
    .eq("id", clientId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function setClientStatus(
  clientId: string,
  status: ClientStatus,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId);
  if (error) throw error;
}

export async function deleteClientRecord(clientId: string): Promise<void> {
  const { supabase } = await authed();
  // Child rows cascade via FK on delete.
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
}

/** Roster counts for the dashboard summary. */
export async function getRosterSummary() {
  const { supabase } = await authed();
  const [active, archived] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "archived"),
  ]);
  return {
    active: active.count ?? 0,
    archived: archived.count ?? 0,
  };
}
