-- Step 1: Credit Engine migration-state marker.
-- The balance backfill (current_credits -> balance) must happen exactly once.
-- Each step records completion here; re-running the migration skips steps
-- that are already marked complete.

create table if not exists public.credit_engine_migration_state (
  step text primary key,
  completed_at timestamptz not null default now(),
  details jsonb
);

alter table public.credit_engine_migration_state enable row level security;
