-- CoachPro — Phase: modality-aware training.
--
-- Personal training isn't just barbells. A plan (and each day inside it) now
-- carries a `modality` — strength, calisthenics, mobility/yoga, conditioning,
-- longevity, lifestyle — so the plan editor and logger can show the fields that
-- modality actually uses (holds, rounds, distance, tempo…) instead of forcing
-- everything into sets × reps × weight.
--
-- EVERYTHING here is additive and defaults to 'strength', so every existing plan,
-- session and set keeps its exact current meaning and all current flows are
-- untouched. Depends on 0002 (workout_sessions, workout_sets) and 0010
-- (workout_plans). Idempotent; run in the Supabase SQL editor or `db push`.

-- A plan's default modality. Individual days may override it (stored in the
-- plan's `days` JSONB, see lib/types.ts PlanDay.modality) — this is the fallback.
alter table public.workout_plans
  add column if not exists modality text not null default 'strength';

-- The modality a logged session was performed as (carried from the plan day, or
-- chosen in the logger for an ad-hoc session).
alter table public.workout_sessions
  add column if not exists modality text not null default 'strength';

-- Cross-modality set metrics. weight_kg/reps/rpe already exist (0002); these two
-- are the next most common and are promoted to real numeric columns so PRs and
-- progress charts can query them directly. The long tail (rounds, calories, avg
-- HR, tempo, side, skill level…) lives in `metrics` jsonb, keyed by field name.
alter table public.workout_sets
  add column if not exists duration_sec numeric(8,1)
    check (duration_sec is null or duration_sec >= 0);
alter table public.workout_sets
  add column if not exists distance_m numeric(10,1)
    check (distance_m is null or distance_m >= 0);
alter table public.workout_sets
  add column if not exists metrics jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
