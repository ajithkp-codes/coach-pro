-- CoachPro, demo booking requests (public marketing lead capture)
-- A visitor on the landing page books a demo call: we store their name, email,
-- profession, preferred time and an optional note. Inserts come from an
-- unauthenticated visitor via a server action using the SERVICE ROLE (which
-- bypasses RLS), so RLS stays on with NO public policy — anon/authenticated
-- clients can neither read nor write this table directly.
-- Run in the Supabase SQL editor (idempotent).

create table if not exists public.demo_requests (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  profession     text,
  preferred_time timestamptz,
  note           text,
  source         text not null default 'landing',
  created_at     timestamptz not null default now()
);

create index if not exists idx_demo_requests_created
  on public.demo_requests (created_at desc);

-- Service role only (used by the server action); RLS blocks everyone else.
grant all on public.demo_requests to service_role;

alter table public.demo_requests enable row level security;

notify pgrst, 'reload schema';
