-- CoachPro — Phase 1 schema, multi-tenancy + RLS
-- Run this in the Supabase SQL editor (or `npx supabase db push` against a linked project).
-- Safe to run more than once (idempotent). Every tenant-owned row carries trainer_id;
-- RLS makes cross-tenant access impossible.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- trainers (tenant / account holder). id == auth.users.id
-- ---------------------------------------------------------------------------
create table if not exists public.trainers (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  business_name text,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_trainers_updated_at on public.trainers;
create trigger trg_trainers_updated_at
  before update on public.trainers
  for each row execute function public.set_updated_at();

-- Create a trainer profile row automatically when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trainers (id, full_name, business_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'business_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  full_name     text not null,
  sex           text not null default 'unspecified'
                  check (sex in ('male','female','other','unspecified')),
  date_of_birth date,
  phone         text,
  email         text,
  notes         text,
  status        text not null default 'active' check (status in ('active','archived')),
  consent_given boolean not null default false,
  consent_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_clients_trainer on public.clients (trainer_id, status, full_name);

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- body_metrics (dated history)
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  measured_on   date not null,
  weight_kg     numeric(6,2),
  height_cm     numeric(6,2),
  body_fat_pct  numeric(5,2),
  chest_cm      numeric(6,2),
  waist_cm      numeric(6,2),
  hips_cm       numeric(6,2),
  arm_cm        numeric(6,2),
  thigh_cm      numeric(6,2),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_body_metrics_client
  on public.body_metrics (trainer_id, client_id, measured_on desc);

drop trigger if exists trg_body_metrics_updated_at on public.body_metrics;
create trigger trg_body_metrics_updated_at
  before update on public.body_metrics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- health_markers (dated clinical readings)
-- ---------------------------------------------------------------------------
create table if not exists public.health_markers (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  measured_on   date not null,
  marker_key    text not null,
  custom_name   text,
  value         numeric(12,3) not null,
  unit          text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_health_markers_client
  on public.health_markers (trainer_id, client_id, marker_key, measured_on desc);

drop trigger if exists trg_health_markers_updated_at on public.health_markers;
create trigger trg_health_markers_updated_at
  before update on public.health_markers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null default 'health' check (category in ('health','workout')),
  metric_key    text,
  start_value   numeric(12,3),
  target_value  numeric(12,3),
  target_unit   text,
  target_date   date,
  status        text not null default 'active'
                  check (status in ('active','achieved','paused','dropped')),
  achieved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_goals_client
  on public.goals (trainer_id, client_id, status);

drop trigger if exists trg_goals_updated_at on public.goals;
create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants — let the Data API roles reach these tables (RLS still gates rows).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row-Level Security — the #1 tenant-isolation control
-- ---------------------------------------------------------------------------
alter table public.trainers       enable row level security;
alter table public.clients        enable row level security;
alter table public.body_metrics   enable row level security;
alter table public.health_markers enable row level security;
alter table public.goals          enable row level security;

-- trainers: a trainer sees and edits only their own profile row.
drop policy if exists trainers_select on public.trainers;
create policy trainers_select on public.trainers
  for select using (id = auth.uid());
drop policy if exists trainers_update on public.trainers;
create policy trainers_update on public.trainers
  for update using (id = auth.uid()) with check (id = auth.uid());
-- (insert handled by the security-definer signup trigger; no public insert policy)

-- Child tables: full CRUD scoped to the owning trainer.
drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists body_metrics_all on public.body_metrics;
create policy body_metrics_all on public.body_metrics
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists health_markers_all on public.health_markers;
create policy health_markers_all on public.health_markers
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

drop policy if exists goals_all on public.goals;
create policy goals_all on public.goals
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tell PostgREST to reload its schema cache so the Data API sees these tables.
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
