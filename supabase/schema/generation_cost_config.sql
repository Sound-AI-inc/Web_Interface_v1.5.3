-- Generation cost config: centralized credit costs per generation type.
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

-- Seed costs matching the credit economy spec.
-- Costs are server-authoritative and multiplied by result count at call time.
insert into public.generation_cost_config (generation_type, model_class, complexity, credit_cost, batch_multiplier, is_active) values
  ('midi',        'github',   'standard', 1, 1, true),
  ('vst_preset',  'internal', 'standard', 1, 1, true),
  ('advanced_audio', 'internal', 'pro',    3, 1, true),
  ('advanced_edit',  'internal', 'pro',    4, 1, true),
  ('batch',          'internal', 'pro',    5, 1, true),
  ('audio_sample',   'internal', 'pro',    2, 1, true)
on conflict do nothing;

-- RPC: resolve active generation cost at call time.
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