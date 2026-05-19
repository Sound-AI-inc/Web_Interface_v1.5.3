create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  model_id text not null,
  tier text not null check (tier in ('lite', 'pro')),
  latency_ms integer not null check (latency_ms >= 0),
  status text not null check (status in ('success', 'error', 'rate_limited', 'unauthorized', 'insufficient_credits', 'cached')),
  error_code text,
  created_at timestamptz not null default now()
);

alter table public.generation_logs drop column if exists component;
alter table public.generation_logs drop column if exists token_usage;
alter table public.generation_logs drop column if exists error;
alter table public.generation_logs drop column if exists metadata;
alter table public.generation_logs add column if not exists status text not null default 'success';
alter table public.generation_logs add column if not exists error_code text;
alter table public.generation_logs alter column status drop default;

alter table public.generation_logs enable row level security;

create index if not exists generation_logs_user_created_at_idx
  on public.generation_logs (user_id, created_at desc);

create index if not exists generation_logs_model_created_at_idx
  on public.generation_logs (model_id, created_at desc);

create policy "Users can read their own generation logs"
  on public.generation_logs
  for select
  to authenticated
  using (auth.uid()::text = user_id);

-- Inserts are intended to happen from server-side API routes with the service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser code or NEXT_PUBLIC_/VITE_ env vars.

create table if not exists public.generation_credit_balances (
  user_id text primary key,
  remaining integer not null check (remaining >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  generation_type text not null check (generation_type in ('audio', 'midi', 'preset')),
  amount integer not null check (amount > 0),
  remaining integer not null check (remaining >= 0),
  created_at timestamptz not null default now()
);

alter table public.generation_credit_balances enable row level security;
alter table public.generation_credit_transactions enable row level security;

create policy "Users can read their own credit balance"
  on public.generation_credit_balances
  for select
  to authenticated
  using (auth.uid()::text = user_id);

create policy "Users can read their own credit transactions"
  on public.generation_credit_transactions
  for select
  to authenticated
  using (auth.uid()::text = user_id);

create table if not exists public.generation_cache (
  cache_key text primary key,
  model_id text not null,
  result jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.generation_cache enable row level security;

create index if not exists generation_cache_expires_at_idx
  on public.generation_cache (expires_at);

create schema if not exists private;

create or replace function private.consume_generation_credits(
  p_user_id text,
  p_generation_type text,
  p_cost integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  update public.generation_credit_balances
     set remaining = remaining - p_cost,
         updated_at = now()
   where user_id = p_user_id
     and remaining >= p_cost
   returning remaining into v_remaining;

  if v_remaining is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.generation_credit_transactions (user_id, generation_type, amount, remaining)
  values (p_user_id, p_generation_type, p_cost, v_remaining);

  return v_remaining;
end;
$$;

revoke all on function private.consume_generation_credits(text, text, integer) from public, anon, authenticated;
grant execute on function private.consume_generation_credits(text, text, integer) to service_role;
