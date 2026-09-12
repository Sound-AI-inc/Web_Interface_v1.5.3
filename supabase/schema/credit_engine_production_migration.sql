-- SoundAI Credit Engine — PRODUCTION MIGRATION (single paste).
-- GENERATED from repo files by scripts/build_production_migration.mjs.
-- Do NOT hand-edit: change the source files and rebuild.
-- ADDITIVE and NON-DESTRUCTIVE. Paste into the Supabase SQL Editor and run.
-- Expected audit baseline: user_credits = 2, credit_transactions = 38.

-- ===========================================================================
-- SOURCE: credit_engine_migration_state.sql
-- ===========================================================================
-- Step 1: Credit Engine migration-state marker.
-- The balance backfill (current_credits -> balance) must happen exactly once.
-- Each step records completion here; re-running the migration skips steps
-- that are already marked complete.

create table if not exists public.credit_engine_migration_state (
  step text primary key,
  completed_at timestamptz not null default now(),
  details jsonb
);

alter table public.credit_engine_migration_state enable row level security;


-- ===========================================================================
-- SOURCE: user_credits.sql
-- ===========================================================================
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

  -- Legacy compat: transaction_type/descriptions are NOT NULL in production.
  -- Engine columns (type/amount/balance_after) stay authoritative; legacy
  -- values are best-effort maps of observed legacy vocab ('earned'/'spent').
  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason, transaction_type, description)
  values (p_user_id, 'generation_reserve', p_amount, v_balance, p_generation_id, p_reason, 'spent', coalesce(p_reason, 'generation_reserve'));

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

  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason, transaction_type, description)
  values (p_user_id, 'generation_spend', p_amount, v_balance, p_generation_id, p_reason, 'spent', coalesce(p_reason, 'generation_spend'));

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

  insert into public.credit_transactions (user_id, type, amount, balance_after, generation_id, reason, transaction_type, description)
  values (p_user_id, 'generation_restore', p_amount, v_balance, p_generation_id, p_reason, 'earned', coalesce(p_reason, 'generation_restore'));

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

  -- id/trial_activated are legacy NOT NULL columns in production; set them
  -- explicitly so fresh engine wallets insert cleanly (harmless when defaults exist).
  insert into public.user_credits (id, user_id, balance, reserved, plan, monthly_allowance, last_refill_at, next_refill_at, subscription_status, trial_activated)
  values (gen_random_uuid(), p_user_id, p_amount, 0, p_plan, v_allowance, now(), now() + interval '24 hours', p_type, (p_plan = 'trial'))
  on conflict (user_id) do update
    set balance = public.user_credits.balance + p_amount,
        -- Upgrade preserves remaining credits: only additive changes here.
        plan = excluded.plan,
        monthly_allowance = coalesce(excluded.monthly_allowance, public.user_credits.monthly_allowance),
        last_refill_at = now(),
        updated_at = now();

  select balance into v_remaining from public.user_credits where user_id = p_user_id;

  begin
    insert into public.credit_transactions (user_id, type, amount, balance_after, reason, plan, metadata, transaction_type, description)
    values (
      p_user_id, p_type, p_amount, v_remaining, p_reason, p_plan,
      case when p_grant_reference is null then null else jsonb_build_object('grant_reference', p_grant_reference) end,
      'earned', coalesce(p_reason, p_type)
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

  insert into public.credit_transactions (user_id, type, amount, balance_after, reason, plan, transaction_type, description)
  values (p_user_id, 'timed_refill', v_refill_amount, v_balance, p_reason, v_wallet.plan, 'earned', coalesce(p_reason, 'timed_refill'));

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


-- ===========================================================================
-- SOURCE: credit_engine_backfill.sql
-- ===========================================================================
-- Steps 3, 4, 6 + pre-commit verification for the Credit Engine migration.
-- Run AFTER the additive user_credits / credit_transactions columns exist.
-- ADDITIVE and NON-DESTRUCTIVE: legacy current_credits, total_earned_credits,
-- trial_* and legacy transaction columns are never modified or dropped.

-- ---------------------------------------------------------------------------
-- Step 3: one-time backfill user_credits.current_credits -> balance.
-- Runs exactly once, gated by the credit_engine_migration_state marker.
-- ---------------------------------------------------------------------------
do $$
declare
  v_already boolean;
begin
  select exists (
    select 1 from public.credit_engine_migration_state
    where step = 'user_credits_backfill'
  ) into v_already;

  if v_already then
    raise notice 'user_credits backfill already completed, skipping.';
    return;
  end if;

  -- Backfill: new authoritative balance starts equal to legacy current_credits.
  update public.user_credits
     set balance = current_credits,
         reserved = coalesce(reserved, 0),
         plan = case when trial_activated then 'trial' else coalesce(nullif(plan, ''), 'free') end,
         monthly_allowance = case when trial_activated then 20 else coalesce(monthly_allowance, 0) end,
         last_refill_at = coalesce(last_refill_at, trial_activated_at, created_at, now()),
         next_refill_at = coalesce(next_refill_at, now() + interval '24 hours'),
         updated_at = now()
   where balance is distinct from current_credits
      or plan is null or monthly_allowance is null;

  -- Verify before proceeding: legacy current_credits = new balance
  -- for every production wallet. Abort (no marker written) on mismatch.
  if exists (
    select 1 from public.user_credits
    where balance is distinct from current_credits
  ) then
    raise exception 'BACKFILL_MISMATCH: balance <> current_credits for some wallets';
  end if;

  if exists (
    select 1 from public.user_credits
    where balance is null or reserved is null
  ) then
    raise exception 'BACKFILL_NULLS: unexpected NULL wallet balances';
  end if;

  insert into public.credit_engine_migration_state (step, details)
  values ('user_credits_backfill', jsonb_build_object(
    'backfilled_at', now(),
    'wallets', (select count(*) from public.user_credits)
  ));
end;
$$;

-- ---------------------------------------------------------------------------
-- Step 4: one wallet per user. Does NOT change the existing primary key.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select user_id from public.user_credits
    group by user_id having count(*) > 1
  ) then
    raise exception 'DUPLICATE_USER_ID: user_credits has duplicate user_id values';
  end if;

  create unique index if not exists user_credits_user_id_uidx
    on public.user_credits (user_id);

  insert into public.credit_engine_migration_state (step, details)
  values ('user_credits_unique_user_id', jsonb_build_object('completed_at', now()))
  on conflict (step) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Step 6: historical transaction mapping.
-- Historical rows remain intact. Legacy transaction_type / description /
-- reference_id are preserved inside metadata. Historical balance_after
-- REMAINS NULL — never fabricated (no balance_after = 0 for history).
-- ---------------------------------------------------------------------------
do $$
begin
  -- Preserve legacy info in metadata (merged, never overwriting engine keys).
  update public.credit_transactions
     set metadata = coalesce(metadata, '{}'::jsonb)
         || jsonb_build_object(
              'legacy_transaction_type', transaction_type,
              'legacy_description', description,
              'legacy_reference_id', reference_id
            )
   where metadata is null
      or not (metadata ? 'legacy_transaction_type');

  -- Best-effort type mapping for known legacy descriptions only.
  -- Unknown legacy rows keep type NULL (they predate the Credit Engine).
  update public.credit_transactions
     set type = 'trial_grant'
   where type is null
     and transaction_type = 'earned'
     and description = 'Free trial credits';

  update public.credit_transactions
     set type = 'admin_adjustment'
   where type is null
     and transaction_type = 'earned'
     and description like 'Special exception%';

  update public.credit_transactions
     set type = 'generation_spend'
   where type is null
     and transaction_type = 'spent'
     and description like '%generation';

  -- Human-readable reason preserves the legacy description text.
  update public.credit_transactions
     set reason = description
   where reason is null
     and description is not null;

  -- No duplicate transaction IDs (PK integrity check).
  if exists (
    select id from public.credit_transactions
    group by id having count(*) > 1
  ) then
    raise exception 'DUPLICATE_TX_ID: credit_transactions has duplicate ids';
  end if;

  insert into public.credit_engine_migration_state (step, details)
  values ('credit_transactions_history_mapped', jsonb_build_object(
    'mapped_at', now(),
    'transactions', (select count(*) from public.credit_transactions)
  ))
  on conflict (step) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pre-commit verification (expected audit counts: user_credits = 2,
-- credit_transactions = 38; records must not be deleted or recreated).
-- ---------------------------------------------------------------------------
do $$
declare
  v_wallets integer;
  v_tx integer;
begin
  select count(*) into v_wallets from public.user_credits;
  select count(*) into v_tx from public.credit_transactions;

  if v_wallets < 2 then
    raise exception 'ROW_COUNT_MISMATCH: user_credits = %, expected at least 2 (possible data loss)', v_wallets;
  end if;

  if v_tx < 38 then
    raise exception 'ROW_COUNT_MISMATCH: credit_transactions = %, expected at least 38 (possible data loss)', v_tx;
  end if;

  if v_wallets <> 2 or v_tx <> 38 then
    raise notice 'COUNT_DRIFT: user_credits = %, credit_transactions = % (audit baseline 2/38; drift means new signups/activity since the audit — review before proceeding).', v_wallets, v_tx;
  end if;

  if exists (
    select 1 from public.user_credits
    where balance is distinct from current_credits
  ) then
    raise exception 'BALANCE_MISMATCH: balance <> current_credits';
  end if;

  raise notice 'VERIFIED: user_credits = %, credit_transactions = %, balances match.', v_wallets, v_tx;
end;
$$;


-- ===========================================================================
-- SOURCE: generation_logs.sql
-- ===========================================================================
-- Generation logs + cache. ADDITIVE and NON-DESTRUCTIVE.
-- Existing columns are never dropped; new Credit Engine columns are added
-- only when missing.

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  -- UUID to match legacy wallet user IDs (auth.users.id). Never alter.
  user_id uuid not null,
  model_id text not null,
  tier text not null check (tier in ('lite', 'pro')),
  latency_ms integer not null check (latency_ms >= 0),
  status text not null check (status in ('success', 'error', 'rate_limited', 'unauthorized', 'insufficient_credits', 'cached')),
  error_code text,
  created_at timestamptz not null default now()
);

-- Credit Engine linkage (nullable: historical rows predate the ledger link).
alter table public.generation_logs add column if not exists transaction_id uuid;
alter table public.generation_logs add column if not exists generation_id uuid;
alter table public.generation_logs add column if not exists metadata jsonb;

alter table public.generation_logs enable row level security;

create index if not exists generation_logs_user_created_at_idx
  on public.generation_logs (user_id, created_at desc);

create index if not exists generation_logs_model_created_at_idx
  on public.generation_logs (model_id, created_at desc);

create index if not exists generation_logs_generation_id_idx
  on public.generation_logs (generation_id);

drop policy if exists "Users can read their own generation logs" on public.generation_logs;
create policy "Users can read their own generation logs"
  on public.generation_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts are intended to happen from server-side API routes with the service role key.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browser code or NEXT_PUBLIC_/VITE_ env vars.

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


-- ===========================================================================
-- SOURCE: idempotency_keys.sql
-- ===========================================================================
-- Idempotency keys: prevents duplicate grants, refills, and generation consumption.
-- Run in Supabase SQL Editor.

create table if not exists public.idempotency_keys (
  key text primary key,
  -- Intentionally TEXT (not uuid): the Stripe webhook stores the sentinel
  -- 'stripe-webhook' here. This column is only ever compared to text
  -- (lookups by key), never to auth.users.id, so no cast is needed.
  user_id text not null,
  action text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists idempotency_keys_expires_at_idx
  on public.idempotency_keys (expires_at);

create index if not exists idempotency_keys_user_action_idx
  on public.idempotency_keys (user_id, action);

alter table public.idempotency_keys enable row level security;

-- Server-side writes only (service role). No authenticated read needed.

-- ===========================================================================
-- SOURCE: subscriptions.sql
-- ===========================================================================
-- Subscriptions table: Stripe-ready billing state machine.
-- Run in Supabase SQL Editor. "Success. No rows returned" is expected for DDL.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Legacy wallet user IDs are UUID (matches auth.users.id). Never alter.
  -- No FOREIGN KEY is declared here to avoid cascade deletes of billing
  -- history; compare with an explicit same-type expression instead:
  -- auth.uid() = subscriptions.user_id.
  user_id uuid not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_product_id text,
  status text not null default 'incomplete'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'paused', 'incomplete', 'incomplete_expired')),
  plan_id text not null default 'free_trial',
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active subscription per user (partial unique index).
create unique index if not exists subscriptions_user_active_idx
  on public.subscriptions (user_id)
  where status in ('trialing', 'active');

create index if not exists subscriptions_stripe_sub_id_idx
  on public.subscriptions (stripe_subscription_id);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Server-side writes only (service role). No authenticated insert/update.

-- ===========================================================================
-- SOURCE: plan_allowances.sql
-- ===========================================================================
-- Plan allowances: refill policy per plan.
-- Run in Supabase SQL Editor.

create table if not exists public.plan_allowances (
  plan_id text primary key,
  monthly_allowance integer not null default 0 check (monthly_allowance >= 0),
  max_balance_cap integer not null default 0 check (max_balance_cap >= 0),
  refill_base_cooldown_hours integer not null default 24 check (refill_base_cooldown_hours >= 1),
  refill_max_cooldown_hours integer not null default 120 check (refill_max_cooldown_hours >= refill_base_cooldown_hours),
  rollover_enabled boolean not null default false,
  downgrade_policy text not null default 'cap',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed plan allowances matching the credit economy spec.
insert into public.plan_allowances (plan_id, monthly_allowance, max_balance_cap, refill_base_cooldown_hours, refill_max_cooldown_hours, rollover_enabled, downgrade_policy)
values
  ('free_trial',   20,  20,   24,  24,  false, 'cap'),
  ('standard_monthly',  30,  30,   24,  120, false, 'cap'),
  ('standard_annual',   30,  30,   24,  120, false, 'cap'),
  ('premium_flex_50',   50,  50,   24,  120, true,  'cap'),
  ('premium_flex_100',  100, 100,  24,  120, true,  'cap'),
  ('premium_flex_500',  500, 500,  24,  120, true,  'cap'),
  ('premium_flex_1000', 1000,1000, 24,  120, true,  'cap'),
  ('premium_flex_3000', 3000,3000, 24,  120, true,  'cap'),
  ('enterprise_custom', 0,   0,    24,  120, false, 'preserve')
on conflict (plan_id) do nothing;

-- ===========================================================================
-- SOURCE: plan_entitlements.sql
-- ===========================================================================
-- Plan entitlements: feature flags per plan.
-- Run in Supabase SQL Editor.

create table if not exists public.plan_entitlements (
  plan_id text not null,
  feature_key text not null,
  enabled boolean not null default true,
  value text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, feature_key)
);

-- Seed entitlements matching the credit economy spec.
insert into public.plan_entitlements (plan_id, feature_key, enabled, value) values
  -- free_trial
  ('free_trial', 'interface_lite', true, 'lite'),
  ('free_trial', 'interface_pro', false, 'pro'),
  ('free_trial', 'audio_basic', true, 'basic'),
  ('free_trial', 'export_mp3', true, 'mp3'),
  ('free_trial', 'library_limited', true, 'limited'),
  ('free_trial', 'support_community', true, 'community'),
  -- standard_monthly / standard_annual
  ('standard_monthly', 'interface_lite', true, 'lite'),
  ('standard_monthly', 'interface_pro', false, 'pro'),
  ('standard_monthly', 'audio_advanced', true, 'advanced'),
  ('standard_monthly', 'export_wav', true, 'wav'),
  ('standard_monthly', 'library_10gb', true, '10gb'),
  ('standard_monthly', 'support_email', true, 'email'),
  ('standard_annual', 'interface_lite', true, 'lite'),
  ('standard_annual', 'interface_pro', false, 'pro'),
  ('standard_annual', 'audio_advanced', true, 'advanced'),
  ('standard_annual', 'export_wav', true, 'wav'),
  ('standard_annual', 'library_10gb', true, '10gb'),
  ('standard_annual', 'support_email', true, 'email'),
  -- premium_flex_*
  ('premium_flex_50', 'interface_lite', true, 'lite'),
  ('premium_flex_50', 'interface_pro', true, 'pro'),
  ('premium_flex_50', 'audio_advanced_plugins', true, 'advanced+plugins'),
  ('premium_flex_50', 'export_wav', true, 'wav'),
  ('premium_flex_50', 'export_midi', true, 'midi'),
  ('premium_flex_50', 'export_mp3', true, 'mp3'),
  ('premium_flex_50', 'library_full', true, 'full'),
  ('premium_flex_50', 'support_priority', true, 'priority'),
  ('premium_flex_100', 'interface_lite', true, 'lite'),
  ('premium_flex_100', 'interface_pro', true, 'pro'),
  ('premium_flex_100', 'audio_advanced_plugins', true, 'advanced+plugins'),
  ('premium_flex_100', 'export_wav', true, 'wav'),
  ('premium_flex_100', 'export_midi', true, 'midi'),
  ('premium_flex_100', 'export_mp3', true, 'mp3'),
  ('premium_flex_100', 'library_full', true, 'full'),
  ('premium_flex_100', 'support_priority', true, 'priority'),
  ('premium_flex_500', 'interface_lite', true, 'lite'),
  ('premium_flex_500', 'interface_pro', true, 'pro'),
  ('premium_flex_500', 'audio_advanced_plugins', true, 'advanced+plugins'),
  ('premium_flex_500', 'export_wav', true, 'wav'),
  ('premium_flex_500', 'export_midi', true, 'midi'),
  ('premium_flex_500', 'export_mp3', true, 'mp3'),
  ('premium_flex_500', 'library_full', true, 'full'),
  ('premium_flex_500', 'support_priority', true, 'priority'),
  ('premium_flex_1000', 'interface_lite', true, 'lite'),
  ('premium_flex_1000', 'interface_pro', true, 'pro'),
  ('premium_flex_1000', 'audio_advanced_plugins', true, 'advanced+plugins'),
  ('premium_flex_1000', 'export_wav', true, 'wav'),
  ('premium_flex_1000', 'export_midi', true, 'midi'),
  ('premium_flex_1000', 'export_mp3', true, 'mp3'),
  ('premium_flex_1000', 'library_full', true, 'full'),
  ('premium_flex_1000', 'support_priority', true, 'priority'),
  ('premium_flex_3000', 'interface_lite', true, 'lite'),
  ('premium_flex_3000', 'interface_pro', true, 'pro'),
  ('premium_flex_3000', 'audio_advanced_plugins', true, 'advanced+plugins'),
  ('premium_flex_3000', 'export_wav', true, 'wav'),
  ('premium_flex_3000', 'export_midi', true, 'midi'),
  ('premium_flex_3000', 'export_mp3', true, 'mp3'),
  ('premium_flex_3000', 'library_full', true, 'full'),
  ('premium_flex_3000', 'support_priority', true, 'priority'),
  -- enterprise_custom
  ('enterprise_custom', 'interface_lite', true, 'lite'),
  ('enterprise_custom', 'interface_pro', true, 'pro'),
  ('enterprise_custom', 'audio_enterprise', true, 'enterprise'),
  ('enterprise_custom', 'export_all', true, 'all'),
  ('enterprise_custom', 'library_enterprise', true, 'enterprise'),
  ('enterprise_custom', 'support_247', true, '247')
on conflict (plan_id, feature_key) do nothing;

-- ===========================================================================
-- SOURCE: generation_cost_config.sql
-- ===========================================================================
-- Generation cost config: centralized, server-authoritative credit costs.
-- Authoritative costs:
--   MIDI = 1 | VST Preset = 1 | Audio Sample = 3 | Advanced Audio = 3
--   Advanced Editing = 4 | Batch = 5
-- Total charge is ALWAYS unit_cost x result_count, computed server-side
-- (private.get_generation_cost). The client must never determine the charge.
-- Run in Supabase SQL Editor.

create table if not exists public.generation_cost_config (
  generation_type text not null,
  model_class text not null,
  complexity text not null default 'standard',
  credit_cost integer not null check (credit_cost > 0),
  batch_multiplier integer not null default 1 check (batch_multiplier >= 1),
  is_active boolean not null default true,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (generation_type, model_class, complexity, effective_from)
);

create index if not exists generation_cost_config_active_idx
  on public.generation_cost_config (is_active, effective_from, effective_to);

-- Seed costs. Idempotent: each row inserts only when no active row exists
-- for the same (generation_type, model_class, complexity).
insert into public.generation_cost_config (generation_type, model_class, complexity, credit_cost, batch_multiplier, is_active)
select v.generation_type, v.model_class, v.complexity, v.credit_cost, 1, true
from (values
  ('midi',           'github',   'standard', 1),
  ('midi',           'internal', 'standard', 1),
  ('vst_preset',     'internal', 'standard', 1),
  ('audio_sample',   'internal', 'pro',      3),
  ('advanced_audio', 'internal', 'pro',      3),
  ('advanced_edit',  'internal', 'pro',      4),
  ('batch',          'internal', 'pro',      5)
) as v(generation_type, model_class, complexity, credit_cost)
where not exists (
  select 1 from public.generation_cost_config c
   where c.generation_type = v.generation_type
     and c.model_class = v.model_class
     and c.complexity = v.complexity
     and c.is_active = true
);

-- Enforce the authoritative costs on every active row (corrects any drift,
-- e.g. a legacy audio_sample cost of 2).
update public.generation_cost_config
   set credit_cost = expected.cost,
       updated_at = now()
  from (values
    ('midi', 1),
    ('vst_preset', 1),
    ('audio_sample', 3),
    ('advanced_audio', 3),
    ('advanced_edit', 4),
    ('batch', 5)
  ) as expected(generation_type, cost)
 where generation_cost_config.generation_type = expected.generation_type
   and generation_cost_config.is_active = true
   and generation_cost_config.credit_cost <> expected.cost;

-- RPC: resolve active generation cost at call time (unit_cost x count).
create or replace function private.get_generation_cost(
  p_generation_type text,
  p_model_class text default null,
  p_complexity text default 'standard',
  p_count integer default 1
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost integer;
  v_multiplier integer;
begin
  if p_count is null or p_count <= 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  select credit_cost, batch_multiplier into v_cost, v_multiplier
  from public.generation_cost_config
  where generation_type = p_generation_type
    and is_active = true
    and (p_model_class is null or model_class = p_model_class)
    and complexity = p_complexity
    and effective_from <= now()
    and (effective_to is null or effective_to >= now())
  order by effective_from desc
  limit 1;

  if v_cost is null then
    -- Fallback: any active cost for this generation type.
    select credit_cost, batch_multiplier into v_cost, v_multiplier
    from public.generation_cost_config
    where generation_type = p_generation_type and is_active = true
    order by effective_from desc
    limit 1;
  end if;

  if v_cost is null then
    raise exception 'UNKNOWN_MODEL' using errcode = 'P0001';
  end if;

  return greatest(1, coalesce(p_count, 1)) * v_cost * coalesce(v_multiplier, 1);
end;
$$;

revoke all on function private.get_generation_cost(text, text, text, integer) from public, anon, authenticated;
grant execute on function private.get_generation_cost(text, text, text, integer) to service_role;


do $$
begin
  raise notice 'CREDIT ENGINE MIGRATION COMPLETE: wallets=%, transactions=%',
    (select count(*) from public.user_credits),
    (select count(*) from public.credit_transactions);
end;
$$;
