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
