-- Credit Engine PUBLIC RPC wrappers (standalone follow-up).
-- WHY: PostgREST only serves exposed schemas (public); the engine RPCs live
-- in `private` (service_role-only). These thin wrappers expose the SAME
-- functions with the SAME names/signatures through `public`, keeping the
-- identical security posture: REVOKED from anon/authenticated/public,
-- GRANTED to service_role only. The worker calls supabase.rpc(...) (public
-- schema) instead of supabase.schema("private").rpc(...).
-- No economics change. No legacy change. Additive only (CREATE OR REPLACE).
-- Run AFTER credit_engine_production_migration.sql. Idempotent.

-- get_generation_cost(unit_cost x count, server-side)
create or replace function public.get_generation_cost(
  p_generation_type text,
  p_model_class text default null,
  p_complexity text default 'standard',
  p_count integer default 1
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.get_generation_cost(p_generation_type, p_model_class, p_complexity, p_count);
$$;
revoke all on function public.get_generation_cost(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.get_generation_cost(text, text, text, integer) to service_role;

-- reserve_credits
create or replace function public.reserve_credits(
  p_user_id uuid,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.reserve_credits(p_user_id, p_amount, p_generation_id, p_reason);
$$;
revoke all on function public.reserve_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_credits(uuid, integer, uuid, text) to service_role;

-- consume_credits
create or replace function public.consume_credits(
  p_user_id uuid,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.consume_credits(p_user_id, p_amount, p_generation_id, p_reason);
$$;
revoke all on function public.consume_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.consume_credits(uuid, integer, uuid, text) to service_role;

-- restore_credits
create or replace function public.restore_credits(
  p_user_id uuid,
  p_amount integer,
  p_generation_id uuid default null,
  p_reason text default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.restore_credits(p_user_id, p_amount, p_generation_id, p_reason);
$$;
revoke all on function public.restore_credits(uuid, integer, uuid, text) from public, anon, authenticated;
grant execute on function public.restore_credits(uuid, integer, uuid, text) to service_role;

-- grant_credits (7-arg, with idempotency reference)
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text default 'trial_grant',
  p_reason text default null,
  p_plan text default 'free',
  p_monthly_allowance integer default null,
  p_grant_reference text default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.grant_credits(p_user_id, p_amount, p_type, p_reason, p_plan, p_monthly_allowance, p_grant_reference);
$$;
revoke all on function public.grant_credits(uuid, integer, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, text, text, text, integer, text) to service_role;

-- grant_credits (6-arg back-compat)
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text default 'trial_grant',
  p_reason text default null,
  p_plan text default 'free',
  p_monthly_allowance integer default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.grant_credits(p_user_id, p_amount, p_type, p_reason, p_plan, p_monthly_allowance, null);
$$;
revoke all on function public.grant_credits(uuid, integer, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.grant_credits(uuid, integer, text, text, text, integer) to service_role;

-- refill_credits (4-arg)
create or replace function public.refill_credits(
  p_user_id uuid,
  p_amount integer default null,
  p_reason text default null,
  p_enforce_cap boolean default true
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.refill_credits(p_user_id, p_amount, p_reason, p_enforce_cap);
$$;
revoke all on function public.refill_credits(uuid, integer, text, boolean) from public, anon, authenticated;
grant execute on function public.refill_credits(uuid, integer, text, boolean) to service_role;

-- refill_credits (3-arg back-compat)
create or replace function public.refill_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null
)
returns integer
language sql
security definer
set search_path = public
as $$
  select private.refill_credits(p_user_id, p_amount, p_reason, true);
$$;
revoke all on function public.refill_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.refill_credits(uuid, integer, text) to service_role;

do $$
begin
  raise notice 'CREDIT ENGINE PUBLIC WRAPPERS READY';
end;
$$;
