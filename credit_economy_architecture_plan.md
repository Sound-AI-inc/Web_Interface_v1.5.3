# SoundAI Credit Economy + Subscription Architecture + Generation Consumption System

## Objective

Build a production-grade, server-authoritative, auditable, idempotent credit economy that can later connect to Stripe without rewriting the generation engine.

## Current Audit Summary

### Current system
- Three competing credit sources:
  - `profiles.credits_balance` / `credits_quota` / `credits_reset_at` (legacy, client-writable via RLS)
  - `user_credits` + `credit_transactions` (active, server-side RPC)
  - `generation_credit_balances` + `generation_credit_transactions` + `consume_generation_credits` (obsolete duplicate)
- Frontend and backend generation costs are inconsistent and hardcoded in different places.
- Credits are consumed after generation, not before.
- No reserve/restore flow for failed generations.
- No idempotency for grants, refills, or generation consumption.
- No subscription table or Stripe-ready billing state.
- No centralized entitlement enforcement in the UI.
- `grantPlanCredits` and `applyGrant` can show fake local balances if the server call fails.
- `api/credits.ts` POST currently allows any authenticated user to request a grant.
- `api/generate.ts` does not use `generationCount` when charging credits.
- `recordGenerationHistory` writes to the wrong `generation_logs` schema and silently fails.
- Cloudflare Worker API routing is not wired for `/api/*`.

### Problems
- Multiple ledgers create conflicting balances.
- Client-side optimism can display incorrect balances.
- Credit consumption is not atomic with generation success/failure.
- No subscription lifecycle, rollover, downgrade, cancellation, or refill engine.
- No deterministic refill policy.
- No Stripe-ready state machine.
- No centralized entitlement model.

### Risks
- Users can manipulate `profiles.credits_balance` directly.
- Users can be over/under charged due to mismatched frontend/backend costs.
- Failed generations can lose credits permanently.
- Concurrent generations can double-spend.
- Refills can be duplicated or missed.
- Billing events cannot be replayed safely.
- Enterprise features are represented as UI text, not entitlement state.

## Recommended Architecture

```text
USER
  ↓
SUBSCRIPTION / PLAN
  ↓
BILLING STATE
  ↓
ENTITLEMENTS
  ↓
CREDIT WALLET
  ↓
CREDIT LEDGER
  ↓
GENERATION COST
  ↓
GENERATION API
  ↓
ASSET
```

Billing remains separated:

```text
Stripe
  ↓
Stripe Webhooks / Billing Events
  ↓
Billing Service
  ↓
Subscription State
  ↓
Plan Resolver
  ↓
Entitlements
  ↓
Credit Service
```

The generation service must never query Stripe directly for credit balance.

## Pending Decisions Requiring Explicit Approval

1. **Audio Sample cost:** recommend **2 credits** per audio sample, but do not implement until approved.
   - If confirmed inference cost `C > 1.8` credit-equivalents, reconsider 3 credits or introduce a higher-cost audio tier.
2. **Adaptive refill algorithm:** recommend deterministic usage-based cooldown with 24h minimum and 120h maximum.
3. **Premium Flex <25% extension:** recommend evaluation at cycle boundary with capped extension credits and expiration at next reset.
4. **Premium Flex 40-credit refill:** model as a separate bucket/add-on, not merged with monthly allocation.

## Credit Economy Specification

### Plans

| Plan | Price | Billing | Initial credits | Max balance | Refill | Cooldown | Entitlements |
|---|---:|---|---:|---:|---|---|---|
| FREE_TRIAL | $0 | 7-day trial | 20 | 20 | yes, while trial active | 24h adaptive | Lite, basic audio, MP3, limited library, community |
| STANDARD | $7/month or $84/year | recurring | 30 | 30 | yes | 24h-120h adaptive | Lite, advanced audio, WAV, basic library, email |
| PREMIUM_FLEX | $50-$1800/month | monthly packages | 50-3000 | package size | yes, separate 40-credit buffer | 24h-120h adaptive | Lite + Pro, advanced editing/plugins, WAV/MIDI/MP3/VST, full library, priority, commercial |
| ENTERPRISE | Custom | contract | custom | custom | custom | custom | Lite + Pro, custom/enterprise, all/custom export, shared enterprise library, dedicated support |

### Generation costs

Centralized config only:

```text
midi          = 1
vstPreset     = 1
advancedAudio = 3
advancedEdit  = 4
batch         = 5
audioSample   = 2 or 3 (pending approval)
```

Cost must be server-side and multiplied by result count.

### Refill rules

- Trial: 20 credits max, 24h adaptive refill while trial active, no refill after expiry.
- Standard: 30 credits max, 24h-120h adaptive refill after full spend.
- Premium Flex: monthly allocation by package, rollover allowed, separate 40-credit timed refill, downgrade caps balance, cancellation preserves credits until period end.
- Enterprise: contract-based, no public package.

### Upgrade / downgrade / cancellation

- Upgrade: preserve remaining credits.
- Downgrade: apply deterministic cap at new package size, record auditable adjustment.
- Cancellation: Pro access and credits remain until period end, no future allocation after termination.

## Economic Simulation

### Assumptions
- 30-day billing cycle.
- Normal usage: 2-3 audio generations/day.
- Moderate usage: 5-8 audio generations/day.
- Heavy usage: 10-20 audio generations/day.
- Inference cost `C` is unknown; margin analysis is expressed in credit-equivalent units.

### Audio Sample = 2 vs 3

| Metric | 2 credits | 3 credits |
|---|---:|---:|
| Trial generations | 10 | 6-7 |
| Standard generations | 15 | 10 |
| Premium 50 generations | 25 | 16-17 |
| Refill pressure | lower | higher |
| Abuse resistance | medium | higher |
| Standard value perception | stronger | weaker |
| Margin buffer | lower | higher |

### Recommendation
- Recommend **2 credits** per audio sample.
- Rationale: better trial conversion, stronger Standard value, lower refill pressure, and sufficient abuse mitigation via rate limits + adaptive cooldown.
- Reconsider 3 if confirmed inference cost `C > 1.8`.

## Refill Algorithm

### Formula

```text
P = package size
R = credits_spent / max(hours_elapsed, 1)
epsilon = P / 120
V = max(R, epsilon)
raw_cooldown = P / V
cooldown = clamp(raw_cooldown, 24, 120)
```

### Simulations

| Usage | Standard cooldown | Premium 50 cooldown |
|---|---:|---:|
| Normal (6 cr/day) | 120h | 120h |
| Moderate (13 cr/day) | ~55h | ~92h |
| Heavy (30 cr/day) | 24h | 40h |

## Database Design

### Tables

1. `public.user_credits`
   - `user_id` PK
   - `balance` integer >= 0
   - `reserved` integer >= 0
   - `plan` text
   - `monthly_allowance` integer
   - `last_refill_at` timestamptz
   - `next_refill_at` timestamptz
   - `subscription_status` text
   - `created_at`, `updated_at`

2. `public.credit_transactions`
   - `id` uuid PK
   - `user_id` text
   - `type` text check in:
     - `trial_grant`
     - `subscription_grant`
     - `credit_purchase`
     - `generation_spend`
     - `generation_reserve`
     - `generation_restore`
     - `timed_refill`
     - `refund`
     - `admin_adjustment`
     - `forfeiture`
   - `amount` integer (positive = grant, negative = spend)
   - `balance_after` integer >= 0
   - `generation_id` uuid nullable
   - `plan` text
   - `reason` text
   - `metadata` jsonb
   - `created_at` timestamptz

3. `public.subscriptions`
   - `id` uuid PK
   - `user_id` text FK auth.users
   - `stripe_customer_id` text unique
   - `stripe_subscription_id` text unique
   - `stripe_price_id` text
   - `stripe_product_id` text
   - `status` text check in Stripe states
   - `plan_id` text
   - `cancel_at_period_end` boolean
   - `canceled_at` timestamptz
   - `current_period_start` timestamptz
   - `current_period_end` timestamptz
   - `trial_end` timestamptz
   - `metadata` jsonb
   - `created_at`, `updated_at`

4. `public.plan_allowances`
   - `plan_id` PK
   - `monthly_allowance` integer
   - `max_balance_cap` integer
   - `refill_base_cooldown_hours` integer
   - `refill_max_cooldown_hours` integer
   - `rollover_enabled` boolean
   - `downgrade_policy` text
   - `metadata` jsonb

5. `public.plan_entitlements`
   - `plan_id` text
   - `feature_key` text
   - `enabled` boolean
   - `value` text
   - `metadata` jsonb

6. `public.generation_cost_config`
   - `generation_type` text
   - `model_class` text
   - `complexity` text
   - `credit_cost` integer > 0
   - `batch_multiplier` integer
   - `is_active` boolean
   - `effective_from` timestamptz
   - `effective_to` timestamptz
   - `metadata` jsonb

7. `public.idempotency_keys`
   - `key` text PK
   - `user_id` text
   - `action` text
   - `status` text check in pending/completed/failed
   - `result` jsonb
   - `created_at` timestamptz
   - `expires_at` timestamptz

8. `public.generation_logs`
   - keep existing, add `transaction_id` FK to `credit_transactions`, `generation_id`, `metadata`

### Relationships

- `user_credits.user_id` -> `auth.users.id`
- `credit_transactions.user_id` -> `auth.users.id`
- `subscriptions.user_id` -> `auth.users.id`
- `credit_transactions.generation_id` -> `generation_logs.id` (nullable)
- `generation_logs.transaction_id` -> `credit_transactions.id` (nullable)

### Constraints / indexes

- Unique active subscription per user.
- Indexes on:
  - `credit_transactions(user_id, created_at desc)`
  - `credit_transactions(generation_id)`
  - `subscriptions(stripe_subscription_id)`
  - `subscriptions(user_id) where active`
  - `generation_cost_config(is_active, effective_from, effective_to)`
  - `idempotency_keys(expires_at)`

### Transactions / RPCs

- `private.consume_credits(...)`
- `private.reserve_credits(...)`
- `private.restore_credits(...)`
- `private.grant_credits(...)`
- `private.refill_credits(...)`
- `private.get_generation_cost(...)`
- All `SECURITY DEFINER`, `search_path = public`, `REVOKE ALL FROM public/anon/authenticated`, `GRANT EXECUTE TO service_role` only.

### Migration strategy

1. Backfill `user_credits` from `profiles` and `generation_credit_balances` with `INSERT ... ON CONFLICT DO NOTHING/UPDATE`.
2. Backfill `credit_transactions` from `generation_credit_transactions`.
3. Create new tables/RPCs additively.
4. Switch API routes to new RPCs.
5. Verify balances and ledger integrity.
6. Drop obsolete `profiles` credit columns and `generation_credit_*` tables only after production verification.
7. Tighten `profiles` RLS to SELECT-only.

## API Contract

### GET /api/credits

Auth: authenticated user only.

Response:

```json
{
  "credits": {
    "balance": 20,
    "reserved": 0,
    "plan": "trial",
    "monthly_allowance": 20,
    "refill_state": "active",
    "next_refill_at": "2026-09-10T13:00:00Z",
    "subscription_status": "trialing",
    "generation_costs": {
      "audio_sample": 2,
      "midi": 1,
      "vst_preset": 1
    },
    "entitlements": {
      "interface": ["lite"],
      "audio": "basic",
      "export": ["mp3"],
      "library": "limited",
      "support": "community"
    }
  }
}
```

### POST /api/generate

Auth: authenticated user only.

Request:

```json
{
  "request": {
    "prompt": "...",
    "component": "SoundCraft",
    "mode": "pro",
    "model_id": "SoundCraft",
    "input_type": "text",
    "output_type": "audio",
    "commercial_intent": true
  },
  "count": 3,
  "idempotency_key": "uuidv4"
}
```

Response:

```json
{
  "asset": { "...": "..." },
  "credits": {
    "consumed": 6,
    "remaining": 14
  }
}
```

Behavior:
1. Authenticate user.
2. Resolve plan from `subscriptions` / `user_credits.plan`.
3. Resolve entitlements.
4. Resolve cost from `generation_cost_config`.
5. Reserve/consume credits atomically.
6. Execute generation.
7. On failure, restore credits automatically.
8. Return asset + backend-confirmed balance.

Error codes:
- `AUTH_REQUIRED`
- `INVALID_SESSION`
- `PLAN_NOT_ACTIVE`
- `ENTITLEMENT_DENIED`
- `INSUFFICIENT_CREDITS`
- `UNKNOWN_MODEL`
- `GENERATION_FAILED`
- `IDEMPOTENCY_REPLAY`
- `REFILL_NOT_DUE`

### Additional endpoints

- `GET /api/subscription`
- `POST /api/subscription/checkout`
- `POST /api/subscription/portal`
- `POST /api/stripe/webhook`
- `POST /api/generations/:id/restore`
- `GET /api/refill/status`

## Stripe Readiness

### Internal plan IDs

- `free_trial`
- `standard_monthly`
- `standard_annual`
- `premium_flex_50`
- `premium_flex_100`
- `premium_flex_500`
- `premium_flex_1000`
- `premium_flex_3000`
- `enterprise_custom`

### Billing states

- `trialing`
- `active`
- `past_due`
- `canceled`
- `paused`
- `incomplete`
- `incomplete_expired`

### Stripe mapping

- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_price_id`
- `stripe_product_id`

### Webhook events

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`
- `invoice.upcoming`

### Credit allocation events

- `trial_grant`
- `subscription_grant`
- `credit_purchase`
- `timed_refill`
- `refund`
- `admin_adjustment`

## Preview/Test Admin Override

- Only in `preview-tests` environment.
- Server-side env vars only:
  - `CREDIT_TEST_ADMIN_ENABLED=true`
  - `CREDIT_TEST_ADMIN_EMAIL=<admin account>`
  - `CREDIT_TEST_ADMIN_BALANCE=5000`
- Production `main` must not set these.
- Do not hardcode 5000 into shared application logic.

## Frontend Behavior

- Top-right counter always shows backend-confirmed balance.
- No client-side deduction.
- No optimistic balance updates after generation.
- After successful generation: `refresh()`.
- After failed generation: restore + `refresh()`.
- Insufficient-credits message only after server-side rejection.
- Refill countdown comes from backend state.

## Implementation Phases

1. Schema migration and ledger consolidation.
2. Server-side credit service and idempotency.
3. Generation cost config and atomic consume/reserve/restore.
4. Subscription table + Stripe-ready state machine.
5. Entitlement resolver and centralized config.
6. API route refactor.
7. Frontend state refactor.
8. Preview/test admin override.
9. Migration verification and cleanup.
10. UX/UI audit after engine is stable.

## Critical Files to Modify

- `supabase/schema/user_credits.sql`
- new `supabase/schema/subscriptions.sql`
- new `supabase/schema/plan_allowances.sql`
- new `supabase/schema/plan_entitlements.sql`
- new `supabase/schema/generation_cost_config.sql`
- new `supabase/schema/idempotency_keys.sql`
- `api/generate.ts`
- `api/credits.ts`
- `api/_lib/credits.ts`
- `api/_lib/auth.ts`
- new `api/stripe/webhook.ts`
- new `api/stripe/checkout.ts`
- new `api/stripe/portal.ts`
- `src/app/lib/creditsService.ts`
- `src/app/hooks/useCredits.ts`
- `src/app/lib/entitlements.ts`
- `src/app/pages/AudioGenerator.tsx`
- `src/app/components/AppHeader.tsx`
- `src/app/pages/Billing.tsx`
- `src/app/components/BillingCard.tsx`
- `src/app/components/UpgradePlanModalContent.tsx`
- `src/app/data/mock.ts`
- `src/app/lib/generationGateway.ts`
- `worker.js`

## Verification

- Build and typecheck.
- Grep for `credits_balance` and obsolete ledger references.
- Unit/integration tests for:
  - idempotent grants
  - concurrent generation
  - failed generation restore
  - refill cooldown
  - downgrade cap
  - admin preview/test override
  - migration integrity
- Deploy to `preview-tests` and `main`.
- Confirm production has no admin override.
