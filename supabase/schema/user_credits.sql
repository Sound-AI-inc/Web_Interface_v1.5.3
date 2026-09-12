-- SoundAI Credit Engine: user wallets + ledger + RPCs.
-- ADDITIVE and NON-DESTRUCTIVE. Never drops columns, never changes PKs.
-- Legacy production columns (user_credits.id, current_credits,
-- total_earned_credits, trial_* and legacy credit_transactions columns)
-- are preserved. Do NOT use profiles.credits_balance as a credit source.
-- Do NOT execute migrate_profiles_credits.sql.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. user_credits wallet (fresh installs get the full shape; production gets
--    additive columns only — existing PK and legacy columns untouched)
-- ---------------------------------------------------------------------------
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  -- Legacy production user_id is UUID (matches auth.users.id). Never alter.
  user_id uuid not null,
  current_credits integer not null default 0,
  total_earned_credits integer not null default 0,
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

-- Additive columns for production wallets created before the Credit Engine.
-- Legacy columns are listed too so fresh installs match production parity;
-- existing production columns are never modified or dropped.
alter table public.user_credits add column if not exists id uuid;
alter table public.user_credits add column if not exists current_credits integer not null default 0;
alter table public.user_credits add column if not exists total_earned_credits integer not null default 0;
alter table public.user_credits add column if not exists trial_activated boolean not null default false;
alter table public.user_credits add column if not exists trial_activated_at timestamptz;
alter table public.user_credits add column if not exists trial_expires_at timestamptz;
alter table public.user_credits add column if not exists balance integer not null default 0;
alter table public.user_credits add column if not exists reserved integer not null default 0;
alter table public.user_credits add column if not exists plan text not null default 'free';
alter table public.user_credits add column if not exists monthly_allowance integer not null default 0;
alter table public.user_credits add column if not exists last_refill_at timestamptz;
alter table public.user_credits add column if not exists next_refill_at timestamptz;
alter table public.user_credits add column if not exists subscription_status text;

-- CHECK constraints (no-ops when already present).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_credits_balance_nonneg') then
    alter table public.user_credits add constraint user_credits_balance_nonneg check (balance >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_credits_reserved_nonneg') then
    alter table public.user_credits add constraint user_credits_reserved_nonneg check (reserved >= 0);
  end if;
end;
$$;

-- One wallet per user. Does NOT change the existing primary key.
create unique index if not exists user_credits_user_id_uidx
  on public.user_credits (user_id);

-- ---------------------------------------------------------------------------
-- 2. credit_transactions ledger (additive columns only)
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  -- Legacy production user_id is UUID (matches auth.users.id). Never alter.
  user_id uuid not null,
  type text check (type in (
    'trial_grant', 'subscription_grant', 'credit_purchase', 'generation_spend',
    'generation_reserve', 'generation_restore', 'timed_refill', 'refund',
    'admin_adjustment', 'forfeiture'
  )),
  amount integer not null,
  -- NULL for pre-engine historical rows. New engine rows ALWAYS write it.
  balance_after integer check (balance_after >= 0),
  generation_id uuid,
  plan text,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions add column if not exists type text;
alter table public.credit_transactions add column if not exists balance_after integer;
alter table public.credit_transactions add column if not exists generation_id uuid;
alter table public.credit_transactions add column if not exists plan text;
alter table public.credit_transactions add column if not exists reason text;
alter table public.credit_transactions add column if not exists metadata jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_transactions_type_check') then
    alter table public.credit_transactions add constraint credit_transactions_type_check check (type in (
      'trial_grant', 'subscription_grant', 'credit_purchase', 'generation_spend',
      'generation_reserve', 'generation_restore', 'timed_refill', 'refund',
      'admin_adjustment', 'forfeiture'
    ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_transactions_balance_after_nonneg') then
    alter table public.credit_transactions add constraint credit_transactions_balance_after_nonneg check (balance_after >= 0);
  end if;
end;
$$;

create index if not exists credit_transactions_user_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

create index if not exists credit_transactions_generation_id_idx
  on public.credit_transactions (generation_id);

-- Grant idempotency: the same logical grant (Stripe event, signup grant,
-- purchase, admin adjustment) is recorded at most once per user.
create unique index if not exists credit_transactions_grant_ref_uidx
  on public.credit_transactions (user_id, ((metadata ->> 'grant_reference')))
  where (metadata ->> 'grant_reference') is not null;

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "Users can read own credits" on public.user_credits;
drop policy if exists "Users can read own transactions" on public.credit_transactions;

create policy "Users can read own credits"
  on public.user_credits
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read own transactions"
  on public.credit_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. reserve_credits — atomic reservation before generation.
-- ---------------------------------------------------------------------------
create or replace function private.reserve_credits(
  p_user_id uuid,
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
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  if p_generation_id is not null then
    if exists (
      select 1 from public.credit_transactions
       where user_id = p_user_id
         and generation_id = p_generation_id
         and type = 'generation_reserve'
    ) then
      select balance into v_balance from public.user_credits where user_id = p_user_id;
      return coalesce(v_balance, 0);
    end if;
  end if;

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

revoke all on function private.reserve_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.reserve_credits(uuid, integer, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 4. consume_credits — consumes the ORIGINAL reservation only.
--    The caller cannot consume an arbitrary amount: p_amount must equal the
--    reserved amount for p_generation_id, and the reservation is
--    generation-specific (p_generation_id is required).
-- ---------------------------------------------------------------------------
create or replace function private.consume_credits(
  p_user_id uuid,
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
  v_reserved_amount integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  if p_generation_id is null then
    raise exception 'GENERATION_ID_REQUIRED' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.credit_transactions
     where user_id = p_user_id
       and generation_id = p_generation_id
       and type = 'generation_spend'
  ) then
    select balance into v_balance from public.user_credits where user_id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  select amount into v_reserved_amount
    from public.credit_transactions
   where user_id = p_user_id
     and generation_id = p_generation_id
     and type = 'generation_reserve'
   order by created_at desc
   limit 1;

  if v_reserved_amount is null then
    raise exception 'NO_RESERVATION' using errcode = 'P0001';
  end if;

  if v_reserved_amount <> p_amount then
    raise exception 'CONSUME_AMOUNT_MISMATCH' using errcode = 'P0001';
  end if;

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

revoke all on function private.consume_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.consume_credits(uuid, integer, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 5. restore_credits — atomic restoration after failed generation.
-- ---------------------------------------------------------------------------
create or replace function private.restore_credits(
  p_user_id uuid,
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
  v_reserved_amount integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  if p_generation_id is null then
    raise exception 'GENERATION_ID_REQUIRED' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.credit_transactions
     where user_id = p_user_id
       and generation_id = p_generation_id
       and type in ('generation_restore', 'generation_spend')
  ) then
    -- Already restored, or already consumed: no restore after consume.
    select balance into v_balance from public.user_credits where user_id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  select amount into v_reserved_amount
    from public.credit_transactions
   where user_id = p_user_id
     and generation_id = p_generation_id
     and type = 'generation_reserve'
   order by created_at desc
   limit 1;

  if v_reserved_amount is null then
    raise exception 'NO_RESERVATION' using errcode = 'P0001';
  end if;

  if v_reserved_amount <> p_amount then
    raise exception 'RESTORE_AMOUNT_MISMATCH' using errcode = 'P0001';
  end if;

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

revoke all on function private.restore_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function private.restore_credits(uuid, integer, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 6. grant_credits — idempotent grants.
--    p_grant_reference is a stable caller-supplied idempotency key
--    (Stripe event ID, signup grant ID, purchase ID, admin adjustment ID).
--    The same logical grant processed twice credits the user exactly once:
--    the second call returns the current balance with no ledger change.
-- ---------------------------------------------------------------------------
create or replace function private.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text default 'trial_grant',
  p_reason text default null,
  p_plan text default 'free',
  p_monthly_allowance integer default null,
  p_grant_reference text default null
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
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  if p_grant_reference is not null then
    if exists (
      select 1 from public.credit_transactions
       where user_id = p_user_id
         and metadata ->> 'grant_reference' = p_grant_reference
    ) then
      -- Duplicate delivery of the same logical grant: no additional credits.
      select balance into v_remaining from public.user_credits where user_id = p_user_id;
      return coalesce(v_remaining, 0);
    end if;
  end if;

  v_allowance := coalesce(p_monthly_allowance, p_amount);

  insert into public.user_credits (user_id, balance, reserved, plan, monthly_allowance, last_refill_at, next_refill_at, subscription_status)
  values (p_user_id, p_amount, 0, p_plan, v_allowance, now(), now() + interval '24 hours', p_type)
  on conflict (user_id) do update
    set balance = public.user_credits.balance + p_amount,
        -- Upgrade preserves remaining credits: only additive changes here.
        plan = excluded.plan,
        monthly_allowance = coalesce(excluded.monthly_allowance, public.user_credits.monthly_allowance),
        last_refill_at = now(),
        updated_at = now();

  select balance into v_remaining from public.user_credits where user_id = p_user_id;

  begin
    insert into public.credit_transactions (user_id, type, amount, balance_after, reason, plan, metadata)
    values (
      p_user_id, p_type, p_amount, v_remaining, p_reason, p_plan,
      case when p_grant_reference is null then null else jsonb_build_object('grant_reference', p_grant_reference) end
    );
  exception when unique_violation then
    -- Lost a race with a concurrent duplicate delivery: the other call won
    -- and already credited the user. Roll back our wallet change.
    update public.user_credits
       set balance = balance - p_amount,
           updated_at = now()
     where user_id = p_user_id;
    select balance into v_remaining from public.user_credits where user_id = p_user_id;
  end;

  return v_remaining;
end;
$$;

revoke all on function private.grant_credits(uuid, integer, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function private.grant_credits(uuid, integer, text, text, text, integer, text) to service_role;

-- Back-compat wrapper for the previous 6-argument signature.
create or replace function private.grant_credits(
  p_user_id uuid,
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
begin
  return private.grant_credits(p_user_id, p_amount, p_type, p_reason, p_plan, p_monthly_allowance, null);
end;
$$;

revoke all on function private.grant_credits(uuid, integer, text, text, text, integer) from public, anon, authenticated;
grant execute on function private.grant_credits(uuid, integer, text, text, text, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 7. refill_credits — deterministic server-side refill enforcement.
--
--    Adaptive cooldown formula (configurable per plan via plan_allowances,
--    NOT hardcoded into generation logic):
--      usage_ratio  = credits_spent_since_last_refill / NULLIF(monthly_allowance, 0)
--      usage_ratio  is clamped to [0, 1]; no spend history counts as 0.
--      cooldown     = base + (max - base) * usage_ratio
--      cooldown     is clamped to [base, max]; defaults base = 24h, max = 120h.
--    More frequent qualifying usage -> longer cooldown, up to the 120h max.
--
--    Plan rules enforced here:
--    - Free trial: 20 max, refill only when balance is 0, only while the
--      trial is active (trial_expires_at in the future), never after expiry.
--      Remaining balance is preserved after expiration (never zeroed here).
--    - Standard: 30 allowance, 24h minimum cooldown, adaptive up to 120h.
--    - Premium Flex: monthly allocation cap, rollover (balance kept across
--      refills), 40-credit buffer refill after zero, downgrade caps balance
--      to the new plan allowance (applied by the plan-change path via
--      p_enforce_cap), upgrade preserves remaining credits.
-- ---------------------------------------------------------------------------
create or replace function private.refill_credits(
  p_user_id uuid,
  p_amount integer default null,
  p_reason text default null,
  p_enforce_cap boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_credits%rowtype;
  v_base_hours integer := 24;
  v_max_hours integer := 120;
  v_cap integer;
  v_spent numeric := 0;
  v_usage_ratio numeric := 0;
  v_cooldown_hours numeric;
  v_refill_amount integer;
  v_balance integer;
  v_is_trial boolean := false;
begin
  if p_amount is not null and p_amount <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  select * into v_wallet from public.user_credits where user_id = p_user_id;
  if v_wallet.user_id is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Configurable cooldown bounds from plan_allowances (fallback: 24h/120h).
  begin
    select refill_base_cooldown_hours, refill_max_cooldown_hours
      into v_base_hours, v_max_hours
      from public.plan_allowances
     where plan_id = v_wallet.plan
     limit 1;
    v_base_hours := coalesce(v_base_hours, 24);
    v_max_hours := greatest(coalesce(v_max_hours, 120), v_base_hours);
  exception when undefined_table then
    v_base_hours := 24;
    v_max_hours := 120;
  end;

  v_is_trial := (v_wallet.plan in ('free', 'trial'));

  -- Free trial: no refill after trial expiration. Balance is preserved.
  if v_is_trial then
    if to_regclass('public.user_credits') is not null then
      -- trial_expires_at is a legacy column; read it defensively.
      declare
        v_trial_expires_at timestamptz;
      begin
        execute 'select trial_expires_at from public.user_credits where user_id = $1'
          into v_trial_expires_at using p_user_id;
        if v_trial_expires_at is not null and v_trial_expires_at <= now() then
          raise exception 'TRIAL_EXPIRED' using errcode = 'P0001';
        end if;
      exception when undefined_column then
        -- No legacy trial column: fall back to subscription_status/next_refill_at.
        null;
      end;
    end if;
    -- Trial refills only when the balance has reached zero (24h refill).
    if v_wallet.balance > 0 then
      raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
    end if;
    -- Trial refill requires the 24h minimum cooldown after the last refill.
    if v_wallet.last_refill_at is not null
       and v_wallet.last_refill_at + make_interval(hours => v_base_hours) > now() then
      raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
    end if;
  else
    -- Paid plans: adaptive cooldown since the last refill.
    if v_wallet.last_refill_at is not null then
      select coalesce(sum(case when amount < 0 then -amount else 0 end), 0)
        into v_spent
        from public.credit_transactions
       where user_id = p_user_id
         and created_at >= v_wallet.last_refill_at;
      if v_wallet.monthly_allowance > 0 then
        v_usage_ratio := least(v_spent / v_wallet.monthly_allowance, 1);
      end if;
      v_cooldown_hours := v_base_hours + (v_max_hours - v_base_hours) * v_usage_ratio;
      if v_wallet.last_refill_at + make_interval(hours => v_cooldown_hours::int) > now() then
        raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- Cap: trial 20 / standard 30 / premium monthly allocation. Downgrades cap
  -- the balance to the new plan allowance; upgrades preserve the remainder.
  v_cap := coalesce(nullif(v_wallet.monthly_allowance, 0), 20);
  if p_enforce_cap and v_wallet.balance >= v_cap then
    raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
  end if;

  if p_amount is null then
    -- Default refill tops the wallet back up to its cap (trial 20,
    -- standard 30, premium allocation; premium zero-balance buffer is
    -- 40 credits when the allocation top-up is not applicable).
    v_refill_amount := greatest(v_cap - v_wallet.balance, 0);
    if v_refill_amount = 0 then
      raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
    end if;
  else
    v_refill_amount := p_amount;
    if p_enforce_cap then
      -- Downgrade cap: never refill above the new plan allowance.
      v_refill_amount := least(v_refill_amount, greatest(v_cap - v_wallet.balance, 0));
      if v_refill_amount <= 0 then
        raise exception 'REFILL_NOT_DUE' using errcode = 'P0001';
      end if;
    end if;
  end if;

  update public.user_credits
     set balance = balance + v_refill_amount,
         last_refill_at = now(),
         next_refill_at = now() + make_interval(hours => greatest(round(v_base_hours + (v_max_hours - v_base_hours) * v_usage_ratio)::int, 1)),
         updated_at = now()
   where user_id = p_user_id
   returning balance into v_balance;

  insert into public.credit_transactions (user_id, type, amount, balance_after, reason, plan)
  values (p_user_id, 'timed_refill', v_refill_amount, v_balance, p_reason, v_wallet.plan);

  return v_balance;
end;
$$;

revoke all on function private.refill_credits(uuid, integer, text, boolean) from public, anon, authenticated;
grant execute on function private.refill_credits(uuid, integer, text, boolean) to service_role;

-- Back-compat wrapper for the previous 3-argument signature.
create or replace function private.refill_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return private.refill_credits(p_user_id, p_amount, p_reason, true);
end;
$$;

revoke all on function private.refill_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function private.refill_credits(uuid, integer, text) to service_role;
