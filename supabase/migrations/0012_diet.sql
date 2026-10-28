-- CoachPro, nutrition: diet plans + intake logging
-- Mirrors the training feature (0010): a trainer authors a diet PLAN for a
-- client (structured meals/day, with calorie + protein targets, and optionally
-- an attached PDF/image of a plan made elsewhere), and LOGS what the client
-- actually ate each day. Progress/adherence is computed from the logs, not the
-- plan. Run in the Supabase SQL editor (idempotent).

-- ---- Diet plans (the prescription) ----
create table if not exists public.diet_plans (
  id               uuid primary key default gen_random_uuid(),
  trainer_id       uuid not null references public.trainers (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  name             text not null,
  notes            text,
  is_active        boolean not null default false,
  target_calories  integer,
  target_protein_g integer,
  days             jsonb not null default '[]'::jsonb,
  -- Optional attachment: a plan the trainer already made, uploaded to the
  -- shared-files storage bucket (path = <trainer_id>/<client_id>/<uuid>.<ext>).
  storage_path     text,
  original_name    text,
  content_type     text,
  size_bytes       bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_diet_plans_client
  on public.diet_plans (trainer_id, client_id, created_at desc);

drop trigger if exists trg_diet_plans_updated_at on public.diet_plans;
create trigger trg_diet_plans_updated_at
  before update on public.diet_plans
  for each row execute function public.set_updated_at();

-- ---- Diet logs: one per day, what the client actually ate ----
create table if not exists public.diet_logs (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.trainers (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  logged_on   date not null,
  water_ml    integer,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_diet_logs_client
  on public.diet_logs (trainer_id, client_id, logged_on desc);

drop trigger if exists trg_diet_logs_updated_at on public.diet_logs;
create trigger trg_diet_logs_updated_at
  before update on public.diet_logs
  for each row execute function public.set_updated_at();

-- ---- Diet log entries: each meal / food the client ate ----
create table if not exists public.diet_log_entries (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.trainers (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  log_id      uuid not null references public.diet_logs (id) on delete cascade,
  position    integer not null default 0,
  meal        text not null default 'other',
  eaten_at    text,
  food        text not null,
  quantity    text,
  calories    integer,
  protein_g   numeric(6,1),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_diet_log_entries_log
  on public.diet_log_entries (log_id, position);

-- ---- RLS: a trainer sees only their own rows (trainer_id = auth.uid()) ----
grant all on public.diet_plans       to anon, authenticated, service_role;
grant all on public.diet_logs        to anon, authenticated, service_role;
grant all on public.diet_log_entries to anon, authenticated, service_role;

alter table public.diet_plans       enable row level security;
alter table public.diet_logs        enable row level security;
alter table public.diet_log_entries enable row level security;

drop policy if exists diet_plans_all on public.diet_plans;
create policy diet_plans_all on public.diet_plans
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists diet_logs_all on public.diet_logs;
create policy diet_logs_all on public.diet_logs
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists diet_log_entries_all on public.diet_log_entries;
create policy diet_log_entries_all on public.diet_log_entries
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
