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
