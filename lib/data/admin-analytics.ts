import "server-only";
import { requireAdmin } from "./admin";
import { PRO_PRICE_INR } from "@/lib/constants";
import type { Plan, SubStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Owner analytics — Phase 1.
 *
 * Everything here is derived from data the platform already stores: row
 * `created_at` timestamps (growth over time) and Supabase Auth
 * `last_sign_in_at` (which trainers are actually using CoachPro). No new
 * tracking tables, no per-event instrumentation, no third-party analytics.
 *
 * Every function is gated by requireAdmin() (owner-only; non-admins are
 * redirected) and runs through the service-role client, so these cross-tenant
 * aggregates are invisible to ordinary trainer accounts.
 *
 * Aggregate-only by design: this module never reads a client's body metrics,
 * health-marker values, goals, or report contents — only counts and dates.
 */

/** One calendar month of growth, oldest first. */
export interface GrowthMonth {
  /** First day of the month, ISO yyyy-mm-01 (chart x-axis key). */
  date: string;
  /** Trainers who signed up in this month. */
  newTrainers: number;
  /** Clients added in this month. */
  newClients: number;
  /** Cumulative trainers at month end. */
  totalTrainers: number;
  /** Cumulative clients at month end. */
  totalClients: number;
}

export type EngagementTier = "active" | "idle" | "dormant";

export interface TrainerEngagement {
  id: string;
  name: string;
  email: string | null;
  clientCount: number;
  lastSeen: string | null; // ISO, or null if never signed in
  tier: EngagementTier;
}

export interface ClientBucket {
  label: string;
  trainers: number;
}

export interface OwnerAnalytics {
  growth: GrowthMonth[];
  engagement: {
    active: number;
    idle: number;
    dormant: number;
    /** Trainers sorted most-recently-seen first, for the activity table. */
    trainers: TrainerEngagement[];
  };
  distribution: {
    buckets: ClientBucket[];
    avgClients: number;
    medianClients: number;
    maxClients: number;
    atFreeLimit: number; // trainers sitting exactly at the free 5-client cap
  };
  totals: {
    trainers: number;
    activeClients: number;
  };
}

const DAY = 86_400_000;
const ACTIVE_DAYS = 7;
const IDLE_DAYS = 30;

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** Build the last `count` month buckets (inclusive of the current month). */
function monthScaffold(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

/** Pull every sign-in timestamp from Supabase Auth, paging through all users. */
async function lastSignInByUser(admin: SupabaseClient): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) map.set(u.id, u.last_sign_in_at ?? null);
    if (data.users.length < 1000) break;
  }
  return map;
}

function tierFor(lastSeen: string | null, now: number): EngagementTier {
  if (!lastSeen) return "dormant";
  const age = now - new Date(lastSeen).getTime();
  if (age <= ACTIVE_DAYS * DAY) return "active";
  if (age <= IDLE_DAYS * DAY) return "idle";
  return "dormant";
}

export async function getOwnerAnalytics(): Promise<OwnerAnalytics> {
  const { admin } = await requireAdmin();

  const [trainersRes, clientsRes, signIns] = await Promise.all([
    admin.from("trainers").select("id, full_name, email, created_at"),
    admin.from("clients").select("trainer_id, status, created_at"),
    lastSignInByUser(admin),
  ]);

  const trainers = (trainersRes.data ?? []) as {
    id: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
  }[];
  const clients = (clientsRes.data ?? []) as {
    trainer_id: string;
    status: string;
    created_at: string;
  }[];

  // ---- Growth over the last 12 months ----
  const keys = monthScaffold(12);
  const index = new Map(keys.map((k, i) => [k, i]));
  const newTrainers = new Array(keys.length).fill(0);
  const newClients = new Array(keys.length).fill(0);
  let trainersBefore = 0;
  let clientsBefore = 0;

  const bucketOf = (iso: string) => {
    const d = new Date(iso);
    return monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  };
  for (const t of trainers) {
    const i = index.get(bucketOf(t.created_at));
    if (i === undefined) trainersBefore++;
    else newTrainers[i]++;
  }
  for (const c of clients) {
    const i = index.get(bucketOf(c.created_at));
    if (i === undefined) clientsBefore++;
    else newClients[i]++;
  }

  let runT = trainersBefore;
  let runC = clientsBefore;
  const growth: GrowthMonth[] = keys.map((date, i) => {
    runT += newTrainers[i];
    runC += newClients[i];
    return {
      date,
      newTrainers: newTrainers[i],
      newClients: newClients[i],
      totalTrainers: runT,
      totalClients: runC,
    };
  });

  // ---- Per-trainer active-client counts ----
  const activeCount = new Map<string, number>();
  for (const c of clients) {
    if (c.status === "active") {
      activeCount.set(c.trainer_id, (activeCount.get(c.trainer_id) ?? 0) + 1);
    }
  }

  // ---- Engagement tiers from last sign-in ----
  const now = Date.now();
  const engagementRows: TrainerEngagement[] = trainers.map((t) => {
    const lastSeen = signIns.get(t.id) ?? null;
    return {
      id: t.id,
      name: t.full_name || t.email || "Unnamed trainer",
      email: t.email,
      clientCount: activeCount.get(t.id) ?? 0,
      lastSeen,
      tier: tierFor(lastSeen, now),
    };
  });
  engagementRows.sort((a, b) => {
    const av = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
    const bv = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
    return bv - av;
  });
  const active = engagementRows.filter((r) => r.tier === "active").length;
  const idle = engagementRows.filter((r) => r.tier === "idle").length;
  const dormant = engagementRows.filter((r) => r.tier === "dormant").length;

  // ---- Clients-per-trainer distribution ----
  const counts = trainers.map((t) => activeCount.get(t.id) ?? 0);
  const buckets: ClientBucket[] = [
    { label: "No clients", trainers: counts.filter((n) => n === 0).length },
    { label: "1–5", trainers: counts.filter((n) => n >= 1 && n <= 5).length },
    { label: "6–15", trainers: counts.filter((n) => n >= 6 && n <= 15).length },
    { label: "16+", trainers: counts.filter((n) => n > 15).length },
  ];
  const sorted = [...counts].sort((a, b) => a - b);
  const totalClientsActive = counts.reduce((s, n) => s + n, 0);
  const avgClients = counts.length ? totalClientsActive / counts.length : 0;
  const medianClients = sorted.length
    ? sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : 0;
  const maxClients = sorted.length ? sorted[sorted.length - 1] : 0;
  const atFreeLimit = counts.filter((n) => n === 5).length;

  return {
    growth,
    engagement: { active, idle, dormant, trainers: engagementRows },
    distribution: {
      buckets,
      avgClients: Math.round(avgClients * 10) / 10,
      medianClients,
      maxClients,
      atFreeLimit,
    },
    totals: { trainers: trainers.length, activeClients: totalClientsActive },
  };
}

// ---------------------------------------------------------------------------
// Phase 2 — Revenue & Funnel
// ---------------------------------------------------------------------------

export interface RenewalRow {
  trainerId: string;
  name: string;
  email: string | null;
  currentEnd: string; // ISO
}

export interface RevenueSummary {
  mrr: number; // ₹
  arr: number; // ₹
  pricePerPro: number;
  proActive: number;
  pastDue: number;
  cancelled: number;
  paidTrainers: number; // ever had a pro row (active+past_due+cancelled)
  conversion: number; // proActive / trainers, 0..1
  upcomingRenewals: RenewalRow[]; // active pro rows ending within 30 days
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const { admin } = await requireAdmin();
  const [trainersRes, subsRes] = await Promise.all([
    admin.from("trainers").select("id, full_name, email"),
    admin.from("subscriptions").select("trainer_id, plan, status, current_end"),
  ]);

  const trainers = (trainersRes.data ?? []) as {
    id: string;
    full_name: string | null;
    email: string | null;
  }[];
  const subs = (subsRes.data ?? []) as {
    trainer_id: string;
    plan: Plan;
    status: SubStatus;
    current_end: string | null;
  }[];
  const trainerById = new Map(trainers.map((t) => [t.id, t]));

  const proRows = subs.filter((s) => s.plan === "pro");
  const proActive = proRows.filter((s) => s.status === "active").length;
  const pastDue = proRows.filter((s) => s.status === "past_due").length;
  const cancelled = proRows.filter((s) => s.status === "cancelled").length;

  const horizon = Date.now() + 30 * DAY;
  const upcomingRenewals: RenewalRow[] = proRows
    .filter((s) => s.status === "active" && s.current_end)
    .filter((s) => {
      const t = new Date(s.current_end as string).getTime();
      return t >= Date.now() && t <= horizon;
    })
    .map((s) => {
      const t = trainerById.get(s.trainer_id);
      return {
        trainerId: s.trainer_id,
        name: t?.full_name || t?.email || "Unnamed trainer",
        email: t?.email ?? null,
        currentEnd: s.current_end as string,
      };
    })
    .sort((a, b) => new Date(a.currentEnd).getTime() - new Date(b.currentEnd).getTime());

  const mrr = proActive * PRO_PRICE_INR;
  return {
    mrr,
    arr: mrr * 12,
    pricePerPro: PRO_PRICE_INR,
    proActive,
    pastDue,
    cancelled,
    paidTrainers: proRows.length,
    conversion: trainers.length ? proActive / trainers.length : 0,
    upcomingRenewals,
  };
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  /** Conversion from the previous stage, 0..1 (null for the first stage). */
  fromPrev: number | null;
  hint: string;
}

/**
 * Acquisition funnel: demo request → signup → approved → first client →
 * activated (any client data recorded) → paid. Each stage is a distinct count
 * of trainers (or demo requests for the top), so later stages are not strictly
 * subsets of earlier ones, but the sequence tracks where trainers drop off.
 */
export async function getFunnel(): Promise<FunnelStage[]> {
  const { admin } = await requireAdmin();
  const [demos, trainersRes, clientsRes, bmRes, hmRes, goalsRes, subsRes] = await Promise.all([
    admin.from("demo_requests").select("id", { count: "exact", head: true }),
    admin.from("trainers").select("id, approved"),
    admin.from("clients").select("trainer_id"),
    admin.from("body_metrics").select("trainer_id"),
    admin.from("health_markers").select("trainer_id"),
    admin.from("goals").select("trainer_id"),
    admin.from("subscriptions").select("plan, status"),
  ]);

  const demoCount = demos.count ?? 0;
  const trainers = (trainersRes.data ?? []) as { id: string; approved: boolean }[];
  const approved = trainers.filter((t) => t.approved).length;

  const withClients = new Set(
    ((clientsRes.data ?? []) as { trainer_id: string }[]).map((r) => r.trainer_id),
  );
  const activated = new Set<string>();
  for (const res of [bmRes, hmRes, goalsRes]) {
    for (const r of (res.data ?? []) as { trainer_id: string }[]) activated.add(r.trainer_id);
  }
  const paid = ((subsRes.data ?? []) as { plan: Plan; status: SubStatus }[]).filter(
    (s) => s.plan === "pro" && s.status === "active",
  ).length;

  const raw = [
    { key: "demo", label: "Demo requests", value: demoCount, hint: "Landing-page interest" },
    { key: "signup", label: "Signed up", value: trainers.length, hint: "Created a trainer account" },
    { key: "approved", label: "Approved", value: approved, hint: "Cleared for platform access" },
    { key: "client", label: "Added a client", value: withClients.size, hint: "Built their roster" },
    { key: "activated", label: "Recorded data", value: activated.size, hint: "Logged metrics, markers or goals" },
    { key: "paid", label: "On Pro", value: paid, hint: "Active paid subscription" },
  ];

  return raw.map((s, i) => ({
    ...s,
    fromPrev: i === 0 ? null : raw[i - 1].value ? s.value / raw[i - 1].value : 0,
  }));
}
