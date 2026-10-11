import "server-only";
import { redirect } from "next/navigation";
import { authed } from "./session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan, SubStatus, Trainer } from "@/lib/types";

/**
 * Gate for every admin data path. Verifies the signed-in user is a platform
 * admin (read from their own trainer row under RLS), then returns a service-role
 * client for cross-tenant reads. Non-admins are redirected away.
 */
export async function requireAdmin(): Promise<{ admin: SupabaseClient; trainerId: string }> {
  const { supabase, trainerId } = await authed();
  const { data } = await supabase
    .from("trainers")
    .select("is_admin")
    .eq("id", trainerId)
    .maybeSingle();
  if (!data?.is_admin) redirect("/dashboard");
  return { admin: createAdminClient(), trainerId };
}

async function count(
  admin: SupabaseClient,
  table: string,
  eqs: Record<string, string> = {},
): Promise<number> {
  let q = admin.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(eqs)) q = q.eq(k, v);
  const { count: c } = await q;
  return c ?? 0;
}

export interface PlatformStats {
  trainers: number;
  admins: number;
  pending: number;
  clients: number;
  activeClients: number;
  proActive: number;
  reports: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { admin } = await requireAdmin();
  const [trainersRows, clients, activeClients, subs, reports] = await Promise.all([
    admin.from("trainers").select("is_admin, approved"),
    count(admin, "clients"),
    count(admin, "clients", { status: "active" }),
    admin.from("subscriptions").select("plan, status"),
    count(admin, "progress_reports"),
  ]);
  const trainers = (trainersRows.data ?? []) as { is_admin: boolean; approved: boolean }[];
  const subsRows = (subs.data ?? []) as { plan: Plan; status: SubStatus }[];
  return {
    trainers: trainers.length,
    admins: trainers.filter((t) => t.is_admin).length,
    pending: trainers.filter((t) => !t.approved).length,
    clients,
    activeClients,
    proActive: subsRows.filter((s) => s.plan === "pro" && s.status === "active").length,
    reports,
  };
}

export interface TrainerRow extends Trainer {
  clientCount: number;
  plan: Plan;
}

export async function listTrainers(search?: string): Promise<TrainerRow[]> {
  const { admin } = await requireAdmin();
  let q = admin.from("trainers").select("*").order("created_at", { ascending: false });
  if (search) {
    const s = search.replace(/[%,()]/g, "").trim();
    if (s) q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,business_name.ilike.%${s}%`);
  }
  const [trainersRes, clientsRes, subsRes] = await Promise.all([
    q,
    admin.from("clients").select("trainer_id, status"),
    admin.from("subscriptions").select("trainer_id, plan, status"),
  ]);

  const clientCounts = new Map<string, number>();
  for (const c of (clientsRes.data ?? []) as { trainer_id: string; status: string }[]) {
    if (c.status === "active") clientCounts.set(c.trainer_id, (clientCounts.get(c.trainer_id) ?? 0) + 1);
  }
  const planByTrainer = new Map<string, Plan>();
  for (const s of (subsRes.data ?? []) as { trainer_id: string; plan: Plan; status: SubStatus }[]) {
    planByTrainer.set(s.trainer_id, s.plan === "pro" && s.status === "active" ? "pro" : "free");
  }

  return ((trainersRes.data ?? []) as Trainer[]).map((t) => ({
    ...t,
    clientCount: clientCounts.get(t.id) ?? 0,
    plan: planByTrainer.get(t.id) ?? "free",
  }));
}

export interface TrainerDetail {
  trainer: Trainer;
  plan: Plan;
  status: SubStatus | null;
  currentEnd: string | null;
  counts: {
    clients: number;
    activeClients: number;
    bodyMetrics: number;
    healthMarkers: number;
    goals: number;
    sessions: number;
    photos: number;
    files: number;
    reports: number;
  };
}

export async function getTrainerDetail(id: string): Promise<TrainerDetail | null> {
  const { admin } = await requireAdmin();
  const { data: trainer } = await admin.from("trainers").select("*").eq("id", id).maybeSingle();
  if (!trainer) return null;

  const [sub, clients, activeClients, bodyMetrics, healthMarkers, goals, sessions, photos, files, reports] =
    await Promise.all([
      admin.from("subscriptions").select("*").eq("trainer_id", id).maybeSingle(),
      count(admin, "clients", { trainer_id: id }),
      count(admin, "clients", { trainer_id: id, status: "active" }),
      count(admin, "body_metrics", { trainer_id: id }),
      count(admin, "health_markers", { trainer_id: id }),
      count(admin, "goals", { trainer_id: id }),
      count(admin, "workout_sessions", { trainer_id: id }),
      count(admin, "client_photos", { trainer_id: id }),
      count(admin, "shared_files", { trainer_id: id }),
      count(admin, "progress_reports", { trainer_id: id }),
    ]);

  const s = sub.data as { plan: Plan; status: SubStatus; current_end: string | null } | null;
  return {
    trainer: trainer as Trainer,
    plan: s && s.plan === "pro" && s.status === "active" ? "pro" : "free",
    status: s?.status ?? null,
    currentEnd: s?.current_end ?? null,
    counts: {
      clients, activeClients, bodyMetrics, healthMarkers, goals, sessions, photos, files, reports,
    },
  };
}

// ---- admin mutations (service role) ----
export async function adminSetPlan(trainerId: string, plan: Plan): Promise<void> {
  const { admin } = await requireAdmin();
  await admin
    .from("subscriptions")
    .upsert(
      { trainer_id: trainerId, plan, status: plan === "pro" ? "active" : "cancelled" },
      { onConflict: "trainer_id" },
    );
}

export async function adminSetIsAdmin(trainerId: string, isAdmin: boolean): Promise<void> {
  const { admin } = await requireAdmin();
  await admin.from("trainers").update({ is_admin: isAdmin }).eq("id", trainerId);
}

export async function adminSetApproved(trainerId: string, approved: boolean): Promise<void> {
  const { admin } = await requireAdmin();
  await admin.from("trainers").update({ approved }).eq("id", trainerId);
}
