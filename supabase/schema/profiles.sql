-- Application profiles (Sprint #3)
-- Run in Supabase SQL Editor. "Success. No rows returned" is expected for DDL.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  credits_balance integer not null default 0,
  credits_quota integer not null default 20,
  plan text not null default 'free' check (plan in ('free', 'premium', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can upsert own profile" on public.profiles;
drop policy if exists "Users manage own profile" on public.profiles;

create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
