-- User onboarding survey responses (Sprint #2)
create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_type text,
  discovery_source text,
  primary_goal text,
  workflow_frequency text,
  main_daw text,
  pain_point text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_onboarding enable row level security;

create policy "Users can read own onboarding"
  on public.user_onboarding for select
  using (auth.uid() = user_id);

create policy "Users can upsert own onboarding"
  on public.user_onboarding for insert
  with check (auth.uid() = user_id);

create policy "Users can update own onboarding"
  on public.user_onboarding for update
  using (auth.uid() = user_id);
