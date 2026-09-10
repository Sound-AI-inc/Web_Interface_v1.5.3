create table if not exists public.user_credits (
  user_id text primary key,
  balance integer not null default 0 check (balance >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  plan text not null default 'free' check (plan in ('free', 'trial', 'standard', 'premium', 'enterprise')),
  monthly_allowance integer not null default 0,
  last_refill_at timestamptz,
  next_refill_at timestamptz,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill legacy `remaining` column into `balance` if it exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_credits' and column_name = 'remaining'
  ) then
    update public.user_credits set balance = remaining where balance = 0 and remaining > 0;
    alter table public.user_credits drop column if exists remaining;
  end if;
end;
$$;

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in (
    'trial_grant', 'subscription_grant', 'credit_purchase', 'generation_spend',
    'generation_reserve', 'generation_restore', 'timed_refill', 'refund',
    'admin_adjustment', 'forfeiture'
  )),
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  generation_id uuid,
  plan text,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists credit_transactions_user_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

create index if not exists credit_transactions_generation_id_idx
  on public.credit_transactions (generation_id);

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "Users can read own credits" on public.user_credits;
drop policy if exists "Users can read own transactions" on public.credit_transactions;

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

-- Reserve credits before generation (balance -= amount, reserved += amount).
create or replace function private.reserve_credits(
  p_user_id text,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.user_credits
     set balance = balance - p_amount,
         reserved = reserved + p_amount,
         updated_at = now()
   where user_id = p_user_id
     and balance >= p_amount
   returning balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason)
  values (p_user_id, 'generation_reserve', p_amount, v_balance, p_generation_id, p_reason);

  return v_balance;
end;
$$;

revoke all on function private.reserve_credits(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.reserve_credits(text, integer, uuid, text) to service_role;

-- Consume reserved credits after successful generation.
create or replace function private.consume_credits(
  p_user_id text,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.user_credits
     set reserved = reserved - p_amount,
         updated_at = now()
   where user_id = p_user_id
     and reserved >= p_amount
   returning balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason)
  values (p_user_id, 'generation_spend', p_amount, v_balance, p_generation_id, p_reason);

  return v_balance;
end;
$$;

revoke all on function private.consume_credits(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.consume_credits(text, integer, uuid, text) to service_role;

-- Restore reserved credits after failed generation.
create or replace function private.restore_credits(
  p_user_id text,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.user_credits
     set reserved = reserved - p_amount,
         balance = balance + p_amount,
         updated_at = now()
   where user_id = p_user_id
     and reserved >= p_amount
   returning balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason)
  values (p_user_id, 'generation_restore', p_amount, v_balance, p_generation_id, p_reason);

  return v_balance;
end;
$$;

revoke all on function private.restore_credits(text, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.restore_credits(text, integer, uuid, text) to service_role;

-- Idempotent grant with conflict-safe upsert.
create or replace function private.grant_credits(
  p_user_id text,
  p_amount integer,
  p_type text default 'trial_grant',
  p_reason text default null,
  p_plan text default 'free',
  p_monthly_allowance integer default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
  v_allowance integer;
begin
  v_allowance := coalesce(p_monthly_allowance, p_amount);

  insert into public.user_credits (user_id, balance, reserved, plan, monthly_allowance, last_refill_at, next_refill_at, subscription_status)
  values (p_user_id, p_amount, 0, p_plan, v_allowance, now(), now() + interval '24 hours', p_type)
  on conflict (user_id) do update
    set balance = public.user_credits.balance + p_amount,
        plan = excluded.plan,
        monthly_allowance = coalesce(excluded.monthly_allowance, public.user_credits.monthly_allowance),
        last_refill_at = now(),
        updated_at = now();

  select balance into v_remaining from public.user_credits where user_id = p_user_id;

  insert into public.credit_transactions (user_id, type, amount, balance_after, reason, plan)
  values (p_user_id, p_type, p_amount, v_remaining, p_reason, p_plan);

  return v_remaining;
end;
$$;

revoke all on function private.grant_credits(text, integer, text, text, text, integer) from public, anon, authenticated;
grant execute on function private.grant_credits(text, integer, text, text, text, integer) to service_role;

-- Deterministic adaptive refill.
create or replace function private.refill_credits(
  p_user_id text,
  p_amount integer,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  update public.user_credits
     set balance = balance + p_amount,
         last_refill_at = now(),
         next_refill_at = now() + interval '24 hours',
         updated_at = now()
   where user_id = p_user_id
   returning balance into v_balance;

  if v_balance is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.credit_transactions (user_id, type, amount, balance_after, reason)
  values (p_user_id, 'timed_refill', p_amount, v_balance, p_reason);

  return v_balance;
end;
$$;

revoke all on function private.refill_credits(text, integer, text) from public, anon, authenticated;
grant execute on function private.refill_credits(text, integer, text) to service_role;

-- Backfill legacy `remaining` column into `balance` if it exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_credits' and column_name = 'remaining'
  ) then
    update public.user_credits set balance = remaining where balance = 0 and remaining > 0;
    alter table public.user_credits drop column if exists remaining;
  end if;
end;
$$;

-- Backfill from obsolete generation_credit_balances.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'generation_credit_balances') then
    insert into public.user_credits (user_id, balance, reserved, plan, created_at, updated_at)
    select user_id, remaining, 0, 'free', now(), now()
    from public.generation_credit_balances
    on conflict (user_id) do nothing;
  end if;
end;
$$;
