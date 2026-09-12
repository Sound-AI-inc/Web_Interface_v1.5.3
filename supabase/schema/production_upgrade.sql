-- SoundAI production schema upgrade (paste into Supabase SQL Editor).
-- Safe / idempotent. Does not drop user_credits rows.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- user_credits: add authoritative columns to the existing table
-- ---------------------------------------------------------------------------
alter table if exists public.user_credits
  add column if not exists balance integer not null default 0;

alter table if exists public.user_credits
  add column if not exists reserved integer not null default 0;

alter table if exists public.user_credits
  add column if not exists plan text not null default 'free';

alter table if exists public.user_credits
  add column if not exists monthly_allowance integer not null default 0;

alter table if exists public.user_credits
  add column if not exists last_refill_at timestamptz;

alter table if exists public.user_credits
  add column if not exists next_refill_at timestamptz;

alter table if exists public.user_credits
  add column if not exists subscription_status text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_credits' and column_name = 'remaining'
  ) then
    update public.user_credits
       set balance = greatest(coalesce(balance, 0), remaining)
     where remaining is not null;
    alter table public.user_credits drop column if exists remaining;
  end if;
end;
$$;
