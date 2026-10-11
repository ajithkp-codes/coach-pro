-- CoachPro — Phase 2 (training logs)
-- Workout sessions and their sets. Run in the Supabase SQL editor (idempotent).
-- Depends on 0001 (public.set_updated_at, public.clients).

-- ---------------------------------------------------------------------------
-- workout_sessions — one dated training session per client
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  performed_on  date not null,
  title         text,
  duration_min  integer check (duration_min is null or duration_min >= 0),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_workout_sessions_client
  on public.workout_sessions (trainer_id, client_id, performed_on desc);

drop trigger if exists trg_workout_sessions_updated_at on public.workout_sessions;
create trigger trg_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_sets — individual sets within a session (one row per set)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  session_id    uuid not null references public.workout_sessions (id) on delete cascade,
  position      integer not null default 0,
  exercise_name text not null,
  reps          numeric(6,1),
  weight_kg     numeric(7,2),
  rpe           numeric(3,1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_workout_sets_session
  on public.workout_sets (session_id, position);
create index if not exists idx_workout_sets_client
  on public.workout_sets (trainer_id, client_id);

drop trigger if exists trg_workout_sets_updated_at on public.workout_sets;
create trigger trg_workout_sets_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants + RLS (tenant isolation, same pattern as 0001)
-- ---------------------------------------------------------------------------
grant all on public.workout_sessions, public.workout_sets
  to anon, authenticated, service_role;

alter table public.workout_sessions enable row level security;
alter table public.workout_sets     enable row level security;

drop policy if exists workout_sessions_all on public.workout_sessions;
create policy workout_sessions_all on public.workout_sessions
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists workout_sets_all on public.workout_sets;
create policy workout_sets_all on public.workout_sets
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
