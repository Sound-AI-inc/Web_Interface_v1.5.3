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