-- CoachPro — allow a signed-in trainer to create their own profile row.
-- Defence-in-depth: the signup trigger normally creates it, but if that didn't
-- run (e.g. the account predates the trigger), the app self-heals by inserting
-- the row. RLS still restricts a trainer to creating only their own row.

drop policy if exists trainers_insert on public.trainers;
create policy trainers_insert on public.trainers
  for insert with check (id = auth.uid());

notify pgrst, 'reload schema';
