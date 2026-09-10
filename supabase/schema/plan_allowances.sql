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
  ('enterprise_custom', 0,   0,    0,   0,   false, 'preserve')
on conflict (plan_id) do nothing;