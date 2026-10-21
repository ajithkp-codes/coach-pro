-- CoachPro, nutrition Phase C: client self-logging + review queue
-- Clients are NOT logins. A trainer turns on a per-client, unguessable logging
-- link (clients.log_token); the client opens /log/<token> and submits what they
-- ate. Submissions land in diet_log_submissions (a staging queue) — the trainer
-- reviews each one and ACCEPTS it into diet_logs (source='client') or discards.
-- The public page writes via the service role (the token is the credential), so
-- there is intentionally no anon RLS policy. Run in the Supabase SQL editor
-- (idempotent).

-- ---- Per-client logging link (standing, reusable; null = turned off) ----
alter table public.clients
  add column if not exists log_token            text unique,
  add column if not exists log_token_created_at timestamptz;

-- ---- Where an accepted/trainer log came from ----
alter table public.diet_logs
  add column if not exists source text not null default 'trainer'
    check (source in ('trainer', 'client'));

-- ---- Client-submitted days awaiting trainer review ----
-- Entries are kept inline as JSONB (a staging record, not the system of record):
-- [{ meal, eaten_at, food, quantity, calories, protein_g, notes }, ...]
create table if not exists public.diet_log_submissions (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.trainers (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  logged_on   date not null,
  water_ml    integer,
  notes       text,
  entries     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One pending submission per client per day: a client editing "today" replaces
-- their earlier draft instead of piling up duplicates in the trainer's queue.
create unique index if not exists idx_diet_log_submissions_day
  on public.diet_log_submissions (client_id, logged_on);
create index if not exists idx_diet_log_submissions_trainer
  on public.diet_log_submissions (trainer_id, created_at desc);

drop trigger if exists trg_diet_log_submissions_updated_at on public.diet_log_submissions;
create trigger trg_diet_log_submissions_updated_at
  before update on public.diet_log_submissions
  for each row execute function public.set_updated_at();

grant all on public.diet_log_submissions to anon, authenticated, service_role;

alter table public.diet_log_submissions enable row level security;

-- Trainers manage only their own queue. The public /log page writes via the
-- service role (which bypasses RLS), so there is deliberately no anon policy.
drop policy if exists diet_log_submissions_all on public.diet_log_submissions;
create policy diet_log_submissions_all on public.diet_log_submissions
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
