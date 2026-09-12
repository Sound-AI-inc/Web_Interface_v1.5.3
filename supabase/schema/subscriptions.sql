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