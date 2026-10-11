-- CoachPro — Phase 4 (reminders + subscriptions)
-- Run in the Supabase SQL editor (idempotent).

-- ---------------------------------------------------------------------------
-- reminders — trainer to-dos, optionally tied to a client
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.trainers (id) on delete cascade,
  client_id   uuid references public.clients (id) on delete cascade,
  title       text not null,
  note        text,
  due_on      date not null,
  done        boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_reminders_trainer
  on public.reminders (trainer_id, done, due_on);
create index if not exists idx_reminders_client
  on public.reminders (client_id);

drop trigger if exists trg_reminders_updated_at on public.reminders;
create trigger trg_reminders_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

grant all on public.reminders to anon, authenticated, service_role;
alter table public.reminders enable row level security;

drop policy if exists reminders_all on public.reminders;
create policy reminders_all on public.reminders
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions — one row per trainer. WRITES go through the service role only
-- (payment webhook / verified checkout), so trainers cannot self-upgrade.
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  trainer_id              uuid primary key references public.trainers (id) on delete cascade,
  plan                    text not null default 'free' check (plan in ('free','pro')),
  status                  text not null default 'active'
                            check (status in ('active','inactive','past_due','cancelled')),
  razorpay_customer_id    text,
  razorpay_subscription_id text,
  current_end             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

grant all on public.subscriptions to anon, authenticated, service_role;
alter table public.subscriptions enable row level security;

-- Trainers may READ their own subscription; they may NOT write it (no insert/
-- update/delete policy). Only the service role (webhook/verify) writes.
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (trainer_id = auth.uid());

notify pgrst, 'reload schema';
