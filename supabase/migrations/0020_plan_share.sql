-- 0020_plan_share — a shareable public link for a workout plan.
--
-- A trainer can hand a client a read-only link to their plan (the days,
-- exercises, sets/reps, notes) without the client needing an account. This
-- mirrors the progress-report share model (0013): a per-plan random token, an
-- on/off revoke flag, and a view counter. Public reads go through the
-- service-role client keyed by the token (see lib/data/plan-public.ts), so the
-- 144-bit token is the capability — no anon RLS policy is added or needed.
--
-- Nothing is shared until the trainer turns a link on, and turning it off
-- (share_revoked = true) makes the link stop resolving immediately while keeping
-- the token so it can be re-enabled.

alter table public.workout_plans
  add column if not exists share_token text unique,
  add column if not exists share_revoked boolean not null default false,
  add column if not exists share_view_count integer not null default 0;

-- Token lookups come from the public page; index them.
create index if not exists idx_workout_plans_share_token
  on public.workout_plans (share_token);
