-- CoachPro, shareable progress reports
-- A trainer generates a branded, public progress report for a client, viewable
-- over an unguessable link (no login). The public page resolves the token with
-- the service role and renders the client's data for the chosen period.
-- Run in the Supabase SQL editor (idempotent).

create table if not exists public.progress_reports (
  id             uuid primary key default gen_random_uuid(),
  trainer_id     uuid not null references public.trainers (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  token          text not null unique,
  title          text,
  period         text not null default '6m' check (period in ('3m','6m','12m','all')),
  include_photos boolean not null default true,
  expires_at     timestamptz,
  revoked        boolean not null default false,
  view_count     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_progress_reports_client
  on public.progress_reports (trainer_id, client_id, created_at desc);

grant all on public.progress_reports to anon, authenticated, service_role;

alter table public.progress_reports enable row level security;

drop policy if exists progress_reports_all on public.progress_reports;
create policy progress_reports_all on public.progress_reports
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
