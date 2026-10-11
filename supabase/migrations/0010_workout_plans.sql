-- CoachPro, weekly workout plans
-- A prescribed plan the trainer writes for a client: days -> exercises with
-- target sets/reps/weight. Stored as JSONB (edited as a whole; progress is
-- computed from the logged sessions, not the plan). Run in the SQL editor.

create table if not exists public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.trainers (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  name        text not null,
  notes       text,
  is_active   boolean not null default false,
  days        jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_workout_plans_client
  on public.workout_plans (trainer_id, client_id, created_at desc);

drop trigger if exists trg_workout_plans_updated_at on public.workout_plans;
create trigger trg_workout_plans_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();

grant all on public.workout_plans to anon, authenticated, service_role;
alter table public.workout_plans enable row level security;

drop policy if exists workout_plans_all on public.workout_plans;
create policy workout_plans_all on public.workout_plans
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
