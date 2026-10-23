-- CoachPro, scheduling Phase D: appointments (the trainer's calendar ledger).
--
-- The active WORKOUT PLAN is the schedule — plan days are weekday-tagged, so the
-- daily/weekly roster is DERIVED from plans (see lib/roster.ts), never re-entered.
-- This table is the thin ledger around that:
--   kind = 'attendance'  → a plan session the trainer marked missed (no_show),
--                          so it drops adherence and feeds the at-risk score.
--   kind = 'event'       → a genuine one-off that isn't part of any plan:
--                          a consult, an assessment, a call.
-- "Showed up" is NOT stored here — it's a logged workout_session (the detailed
-- training record). Tenant-scoped under RLS like every other table. Idempotent;
-- run in the Supabase SQL editor or `npx supabase db push`.

create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.trainers (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete cascade,
  kind         text not null default 'event',
  starts_at    timestamptz not null,
  duration_min integer not null default 60,
  title        text,
  location     text,
  status       text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes        text,
  -- Optional link to the training log created from this session, if any.
  session_id   uuid references public.workout_sessions (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- If the table pre-dates the plan-is-schedule model, add the kind column in place.
alter table public.appointments
  add column if not exists kind text not null default 'event';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'appointments_kind_check'
  ) then
    alter table public.appointments
      add constraint appointments_kind_check check (kind in ('event', 'attendance'));
  end if;
end $$;

create index if not exists idx_appointments_trainer_starts
  on public.appointments (trainer_id, starts_at);
create index if not exists idx_appointments_client_starts
  on public.appointments (client_id, starts_at);

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

grant all on public.appointments to anon, authenticated, service_role;

alter table public.appointments enable row level security;

-- Trainers manage only their own calendar.
drop policy if exists appointments_all on public.appointments;
create policy appointments_all on public.appointments
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
