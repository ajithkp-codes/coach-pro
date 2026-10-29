-- 0019_ai_usage — a per-trainer daily cap on paid AI calls.
--
-- Every AI import hits a metered, paid provider. Without a cap, one trainer
-- looping the importer (or a buggy client) can run up the bill unbounded. This
-- adds a tiny per-trainer, per-day counter and an atomic bump-and-check RPC the
-- server calls before each expensive AI extract.
--
-- The app FAILS OPEN if this migration hasn't been applied yet (the limiter
-- treats a missing table/function as "allowed" and logs once), so deploying the
-- code before the migration never blocks imports — it just means no cap until
-- this runs. Apply it to enable the cap.

create table if not exists public.ai_usage (
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  day        date not null,
  count      integer not null default 0,
  primary key (trainer_id, day)
);

alter table public.ai_usage enable row level security;

-- A trainer may read their own usage (e.g. to show "X of Y imports used today");
-- writes go only through the SECURITY DEFINER function below, never direct DML.
drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
  for select using (trainer_id = auth.uid());

-- Atomically increment today's counter for the calling trainer and report
-- whether they are still within `p_limit`. The counter is only incremented while
-- under the limit, so a blocked trainer's count doesn't inflate, and the window
-- resets naturally at UTC midnight (a new `day` row). Returns false when there is
-- no authenticated trainer.
create or replace function public.bump_ai_usage(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  new_count integer;
begin
  if uid is null then
    return false;
  end if;

  insert into public.ai_usage (trainer_id, day, count)
  values (uid, today, 1)
  on conflict (trainer_id, day) do update
    set count = public.ai_usage.count + 1
    where public.ai_usage.count < p_limit
  returning count into new_count;

  -- new_count is null when the conflicting row was already at the limit (the
  -- WHERE skipped the update), i.e. the trainer is over budget for today.
  return new_count is not null;
end;
$$;

revoke all on function public.bump_ai_usage(integer) from public;
grant execute on function public.bump_ai_usage(integer) to authenticated;

comment on table public.ai_usage is
  'Per-trainer, per-day count of paid AI calls, enforced via bump_ai_usage().';
