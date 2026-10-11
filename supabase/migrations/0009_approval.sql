-- CoachPro, admin approval gate for new signups
-- New trainers sign up but land in a pending state (approved = false) and cannot
-- use the app until an admin approves them. Existing accounts are approved so no
-- one is locked out.
-- Run in the Supabase SQL editor (idempotent; the backfill is a one-time step).

alter table public.trainers
  add column if not exists approved boolean not null default false;

-- One-time backfill: approve everyone who already has an account.
-- (New signups default to false via the column default and the signup trigger.)
update public.trainers set approved = true where approved = false;

notify pgrst, 'reload schema';
