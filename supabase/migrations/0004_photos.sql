-- CoachPro — Phase 2 (progress photos)
-- Private Storage bucket + metadata table. Run in the Supabase SQL editor (idempotent).
-- Files are never public: the app serves them via short-lived signed URLs.
-- Storage path convention: <trainer_id>/<client_id>/<uuid>.<ext>  (first folder = owner)

-- ---------------------------------------------------------------------------
-- Private bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', false)
on conflict (id) do nothing;

-- Storage RLS: a trainer may only touch objects whose first folder is their uid.
drop policy if exists client_photos_select on storage.objects;
create policy client_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_photos_insert on storage.objects;
create policy client_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists client_photos_delete on storage.objects;
create policy client_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Photo metadata
-- ---------------------------------------------------------------------------
create table if not exists public.client_photos (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.trainers (id) on delete cascade,
  client_id     uuid not null references public.clients (id) on delete cascade,
  storage_path  text not null,
  taken_on      date not null,
  caption       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_client_photos_client
  on public.client_photos (trainer_id, client_id, taken_on desc);

grant all on public.client_photos to anon, authenticated, service_role;

alter table public.client_photos enable row level security;

drop policy if exists client_photos_all on public.client_photos;
create policy client_photos_all on public.client_photos
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

notify pgrst, 'reload schema';
