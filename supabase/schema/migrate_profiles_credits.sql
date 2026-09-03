-- Migration: Add credits columns to profiles + grant admin credits
-- Run this in Supabase SQL Editor (may show "Success. No rows returned" for DDL).
-- Idempotent: safe to run multiple times.

-- Add credits columns if missing
alter table public.profiles
  add column if not exists credits_balance integer not null default 0;

alter table public.profiles
  add column if not exists credits_quota integer not null default 20;

alter table public.profiles
  add column if not exists credits_reset_at timestamptz;

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'premium', 'enterprise'));

-- Backfill existing profiles with defaults
update public.profiles
  set credits_balance = 0,
      credits_quota = 20,
      plan = 'free'
  where credits_balance is null;

-- Grant 5000 admin credits to soundai.inc@gmail.com
update public.profiles
  set credits_balance = 5000,
      credits_quota = 5000
  where id in (
    select id from auth.users where email = 'soundai.inc@gmail.com'
  );
