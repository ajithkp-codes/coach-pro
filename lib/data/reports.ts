import { randomBytes } from "crypto";
import { authed } from "./session";
import type { ProgressReport } from "@/lib/types";
import type { ReportInput } from "@/lib/validation";

const EXPIRY_DAYS: Record<string, number | null> = {
  "7": 7,
  "30": 30,
  "90": 90,
  never: null,
};

export async function listReports(clientId: string): Promise<ProgressReport[]> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("progress_reports")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProgressReport[];
}

export async function createReport(
  clientId: string,
  input: ReportInput,
): Promise<ProgressReport> {
  const { supabase, trainerId } = await authed();
  const token = randomBytes(18).toString("base64url");
  const days = EXPIRY_DAYS[input.expires_in_days];
  const expires_at =
    days === null ? null : new Date(Date.now() + days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      token,
      title: input.title,
      period: input.period,
      include_photos: input.include_photos,
      expires_at,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProgressReport;
}

export async function setReportRevoked(
  id: string,
  revoked: boolean,
): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("progress_reports")
    .update({ revoked })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReport(id: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase.from("progress_reports").delete().eq("id", id);
  if (error) throw error;
}
