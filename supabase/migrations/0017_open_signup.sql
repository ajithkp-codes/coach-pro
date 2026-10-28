-- Open self-serve signup: remove the admin-approval wall.
--
-- The `approved` flag (added in 0009) is repurposed from "admin has approved
-- this account" to "account is active (not suspended)". New trainers are now
-- active on signup; an admin can still SUSPEND anyone by setting approved=false,
-- which blocks their login (see the dashboard layout gate). This keeps every
-- existing admin control working — only the default and meaning change.

alter table public.trainers
  alter column approved set default true;

-- Backfill: any account still sitting in the old "pending" state goes live.
update public.trainers set approved = true where approved = false;
