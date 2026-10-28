-- 0018_client_source — record how each client entered the roster.
--
-- The Clients list needs to show *how* a client was added (typed in by hand vs
-- brought in through the Excel importer vs extracted by the AI importer). None
-- of that was stored, so add a small enumerated column and stamp it at each of
-- the three insert paths (createClientRecord, and the plain / AI bulk imports).
--
-- Existing rows predate the column, so their true origin is unknown; the column
-- default ('manual') backfills them as hand-added, which is the safe assumption
-- for a roster that was mostly typed in before importing existed.

alter table public.clients
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'excel', 'ai_import'));

comment on column public.clients.source is
  'How the client was added: manual (typed in), excel (sheet importer), ai_import (AI importer).';
