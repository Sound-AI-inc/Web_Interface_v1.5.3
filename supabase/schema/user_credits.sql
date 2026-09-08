create table if not exists public.user_credits (
  user_id text primary key,
  remaining integer not null default 0 check (remaining >= 0),
  plan text not null default 'free' check (plan in ('free', 'trial', 'standard', 'premium', 'enterprise')),
  monthly_allowance integer not null default 0,
  reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in (
    'trial_grant', 'subscription_grant', 'purchase', 'generation_spend',
    'timed_refill', 'admin_grant', 'refund', 'adjustment'
  )),
  amount integer not null,
  remaining integer not null check (remaining >= 0),
  reason text,
  generation_id uuid,
  plan text not null default 'free',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

create policy "Users can read own credits"
  on public.user_credits
  for select
  to authenticated
  using (auth.uid()::text = user_id);

create policy "Users can read own transactions"
  on public.credit_transactions
  for select
  to authenticated
  using (auth.uid()::text = user_id);

create schema if not exists private;

create or replace function private.consume_user_credits(
  p_user_id text,
  p_amount integer,
  p_type text default 'generation_spend',
  p_reason text default null,
  p_generation_id uuid default null,
  p_plan text default 'free'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  update public.user_credits
     set remaining = remaining - p_amount,
         updated_at = now()
   where user_id = p_user_id
     and remaining >= p_amount
   returning remaining into v_remaining;

  if v_remaining is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, type, amount, remaining, reason, generation_id, plan)
  values (p_user_id, p_type, p_amount, v_remaining, p_reason, p_generation_id, p_plan);

  return v_remaining;
end;
$$;

revoke all on function private.consume_user_credits(text, integer, text, text, uuid, text) from public, anon, authenticated;
grant execute on function private.consume_user_credits(text, integer, text, text, uuid, text) to service_role;

create or replace function private.grant_user_credits(
  p_user_id text,
  p_amount integer,
  p_type text default 'trial_grant',
  p_reason text default null,
  p_plan text default 'free'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  insert into public.user_credits (user_id, remaining, plan, monthly_allowance, reset_at)
  values (p_user_id, p_amount, p_plan, p_amount, now())
  on conflict (user_id) do update
    set remaining = public.user_credits.remaining + p_amount,
        plan = excluded.plan,
        updated_at = now();

  select remaining into v_remaining from public.user_credits where user_id = p_user_id;

  insert into public.credit_transactions (user_id, type, amount, remaining, reason, plan)
  values (p_user_id, p_type, p_amount, v_remaining, p_reason, p_plan);

  return v_remaining;
end;
$$;

revoke all on function private.grant_user_credits(text, integer, text, text, text) from public, anon, authenticated;
grant execute on function private.grant_user_credits(text, integer, text, text, text) to service_role;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'generation_credit_balances') then
    insert into public.user_credits (user_id, remaining, plan, created_at, updated_at)
    select user_id, remaining, 'free', now(), now()
    from public.generation_credit_balances
    on conflict (user_id) do nothing;
  end if;
end;
$$;
