-- CoachPro — Phase 3 (sharing)
-- Trainer uploads a file for a client and shares it via an unguessable public link.
-- Files live in a PRIVATE bucket; the public /share/<token> page resolves the token
-- server-side (service role) and hands out a short-lived signed download URL.
-- Run in the Supabase SQL editor (idempotent).

-- Private bucket for shared files
insert into storage.buckets (id, name, public)
values ('shared-files', 'shared-files', false)
on conflict (id) do nothing;

-- Storage RLS: a trainer manages only objects under their own uid folder.
-- (The public download path uses the service role, which bypasses these.)
drop policy if exists shared_files_select on storage.objects;
create policy shared_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'shared-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists shared_files_insert on storage.objects;
create policy shared_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shared-files' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists shared_files_delete on storage.objects;
create policy shared_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'shared-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Share metadata
create table if not exists public.shared_files (
  id             uuid primary key default gen_random_uuid(),
  trainer_id     uuid not null references public.trainers (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  storage_path   text not null,
  original_name  text not null,
  content_type   text,
  size_bytes     bigint,
  title          text,
  token          text not null unique,
  expires_at     timestamptz,
  revoked        boolean not null default false,
  download_count integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_shared_files_client
  on public.shared_files (trainer_id, client_id, created_at desc);

grant all on public.shared_files to anon, authenticated, service_role;

alter table public.shared_files enable row level security;

-- Trainers manage only their own shares. The public page reads via service role,
-- so there is intentionally no anon policy here.
drop policy if exists shared_files_all on public.shared_files;
create policy shared_files_all on public.shared_files
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
