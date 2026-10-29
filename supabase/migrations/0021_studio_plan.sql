-- CoachPro — add the Studio tier to the subscriptions plan ladder.
-- Run in the Supabase SQL editor (idempotent).
--
-- The subscriptions.plan check constraint from 0006 only allowed ('free','pro').
-- Widen it to include 'studio'. Drop-then-add so re-running is safe.

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'pro', 'studio'));
