-- Idempotency keys: prevents duplicate grants, refills, and generation consumption.
-- Run in Supabase SQL Editor.

create table if not exists public.idempotency_keys (
  key text primary key,
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