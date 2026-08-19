-- User onboarding survey responses (Sprint #2)
-- Run in Supabase SQL Editor. "Success. No rows returned" is expected for DDL.
create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_type text,
  discovery_source text,
  country_of_residence text,
  primary_goal text,
  workflow_frequency text,
  main_daw text,
  pain_point text,
  completed_at timestamptz,
  tour_completed_at timestamptz,
  tour_skipped_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_onboarding
  add column if not exists country_of_residence text;

alter table public.user_onboarding enable row level security;

-- Allow authenticated users to manage their own onboarding row (insert + update + select)
drop policy if exists "Users can read own onboarding" on public.user_onboarding;
drop policy if exists "Users can upsert own onboarding" on public.user_onboarding;
drop policy if exists "Users can update own onboarding" on public.user_onboarding;
drop policy if exists "Users manage own onboarding" on public.user_onboarding;

create policy "Users manage own onboarding"
  on public.user_onboarding
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.user_onboarding to authenticated;
