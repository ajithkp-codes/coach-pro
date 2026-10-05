-- CoachPro, platform admin role
-- A platform admin oversees the whole product (trainers, subscriptions, usage).
-- Admins are flagged on their trainer row. Cross-tenant reads happen server-side
-- via the service role, gated by an is_admin check, so RLS stays strict for
-- everyone else and no client health data is exposed through normal policies.
-- Run in the Supabase SQL editor (idempotent).

alter table public.trainers
  add column if not exists is_admin boolean not null default false;

notify pgrst, 'reload schema';
