-- Schema sync: Ensure profiles table has credits_balance, credits_quota, credits_reset_at
-- Run this in Supabase SQL Editor if you get:
-- "column profiles.credits_balance does not exist"
-- These columns are defined in supabase/schema/profiles.sql

alter table public.profiles
  add column if not exists credits_balance integer not null default 0;

alter table public.profiles
  add column if not exists credits_quota integer not null default 20;

alter table public.profiles
  add column if not exists credits_reset_at timestamptz;

-- Ensure existing profiles get default credit values
update public.profiles
  set credits_balance = 0,
      credits_quota = 20
  where credits_balance is null;

-- Grant 5000 credits to admin account(s)
update public.profiles
  set credits_balance = 5000,
      credits_quota = 5000
  where id in (
    select id from auth.users where email = 'soundai.inc@gmail.com'
  );
