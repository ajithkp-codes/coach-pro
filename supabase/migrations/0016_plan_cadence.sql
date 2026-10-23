-- CoachPro — plan cadence + plan-bound sessions.
--
-- Two additions, both additive and defaulted so every existing plan and session
-- keeps its current meaning (a plain weekly plan, an ad-hoc session):
--
-- 1. A plan now has a CADENCE — it is authored as one weekly structure (`days`)
--    that repeats for `duration_weeks`. "Weekly" = 1 week (today's behaviour),
--    "Monthly" = 4, custom = any 1..52. `starts_on` anchors the schedule.
--
-- 2. A logged session can point back at the plan + plan day it fulfils, so the
--    session log follows the trainer's plan instead of being free-form, and we
--    can tell which prescribed day/week a session belongs to.
--
-- Depends on 0010 (workout_plans) and 0002 (workout_sessions). Idempotent.

alter table public.workout_plans
  add column if not exists cadence text not null default 'weekly';
alter table public.workout_plans
  add column if not exists duration_weeks int not null default 1
    check (duration_weeks between 1 and 52);
alter table public.workout_plans
  add column if not exists starts_on date;

alter table public.workout_sessions
  add column if not exists plan_id uuid
    references public.workout_plans (id) on delete set null;
alter table public.workout_sessions
  add column if not exists plan_day text;
alter table public.workout_sessions
  add column if not exists week_number int
    check (week_number is null or week_number between 1 and 52);

create index if not exists idx_workout_sessions_plan
  on public.workout_sessions (plan_id);

notify pgrst, 'reload schema';
