# SoundAI Credit Infrastructure Diagnostics — 2026-09-10

## A. Production routing

```text
Frontend (generationGateway.ts → POST /api/generate)
   ↓
Cloudflare Worker (worker/index.ts)
   ↓  route match: /api/generate | /api/credits | /api/stripe/*
   ↓
Node handler adapter (api/_lib/workerAdapter.ts)
   ↓
api/generate.ts | api/credits.ts
   ↓
Credit Service (api/_lib/credits.ts)
   ↓
Supabase RPCs (private.reserve_credits, consume_credits, restore_credits, get_generation_cost)
   ↓
Generation orchestration (src/app/lib/ai/*)
   ↓
Consume / Restore + generation_logs insert
   ↓
JSON response with credits.remaining
```

### Root cause: `/api/generate → 404`

| Layer | Status | Finding |
|-------|--------|---------|
| **Routing** | **FAIL** | `worker.js` forwarded `/api/*` to the static ASSETS binding only. No API handler was deployed. |
| **API** | Present (unwired) | Vercel-style handlers existed in `api/` but were never mounted in the Worker. |
| **Build** | Partial | `wrangler.toml` pointed at `worker.js`; frontend build produced `dist/` only. |

### Fix applied

- Added `worker/index.ts` with explicit API route table.
- Added `api/_lib/workerAdapter.ts` to run existing Node handlers under Workers `nodejs_compat`.
- Updated `wrangler.toml` → `main = "worker/index.ts"`.
- Updated deploy script → `wrangler deploy` (Worker + Assets).

---

## B. Database availability (schema files in repo)

| Table / object | Schema file | Production status |
|----------------|-------------|-------------------|
| `user_credits` | `supabase/schema/user_credits.sql` | **Verify in Supabase** |
| `credit_transactions` | same file | **Verify in Supabase** |
| `generation_logs` | `supabase/schema/generation_logs.sql` | **404 = table missing in prod** |
| `subscriptions` | `supabase/schema/subscriptions.sql` | **Verify in Supabase** |
| `plan_allowances` | `supabase/schema/plan_allowances.sql` | **Verify in Supabase** |
| `plan_entitlements` | `supabase/schema/plan_entitlements.sql` | **Verify in Supabase** |
| `generation_cost_config` | `supabase/schema/generation_cost_config.sql` | **Verify in Supabase** |
| `idempotency_keys` | `supabase/schema/idempotency_keys.sql` | **Verify in Supabase** |

Apply via Supabase SQL Editor using files in `supabase/schema/` (see `apply_production.sql` for order).

---

## C. RPC availability

| RPC | Location | Called by |
|-----|----------|-----------|
| `private.get_generation_cost` | `generation_cost_config.sql` | `resolveGenerationCost()` |
| `private.reserve_credits` | `user_credits.sql` | `reserveCredits()` |
| `private.consume_credits` | `user_credits.sql` | `consumeCredits()` |
| `private.restore_credits` | `user_credits.sql` | `restoreCredits()` |
| `private.grant_credits` | `user_credits.sql` | Stripe webhook / lifecycle |
| `private.refill_credits` | `user_credits.sql` | Refill scheduler |

All RPCs are `service_role` only — correct for server-authoritative credits.

---

## D. Runtime flow (post-fix)

```text
1. Authenticate (Bearer → supabase.auth.getUser)
2. Resolve subscription (subscriptions table → plan_id)
3. Resolve entitlements (plan_entitlements — via /api/credits)
4. Resolve cost (get_generation_cost; audio → audio_sample mapping)
5. Multiply cost × count
6. reserve_credits (atomic)
7. Execute generation
8. Success → consume_credits | Failure → restore_credits
9. Log to generation_logs (server-side, service role)
10. Return credits.remaining in response
11. Frontend refreshCredits() from /api/credits
```

---

## E. Failure classification

| Issue | Classification | Resolution |
|-------|----------------|------------|
| POST /api/generate → 404 | **Routing** | Wire API in `worker/index.ts` |
| GET generation_logs → 404 | **Schema** | Apply `generation_logs.sql` in production Supabase |
| audio_sample cost = 2 in seed | **Credit service config** | Updated to 3 credits |
| output_type `audio` vs `audio_sample` mismatch | **Credit service** | Added mapping in `api/_lib/credits.ts` |
| Client insert into generation_logs (wrong columns) | **Frontend sync / Logging** | Disabled; server logs authoritatively |
| Premium inactivity 25% rule | **Billing** | **Not implemented** — ambiguous business rules (see spec §21) |

---

## Premium inactivity rule — blocked

Cannot implement deterministically without answers to:

- Measurement period boundaries
- Definition of “spends” (consumption vs reservation vs refill vs purchased)
- Stripe period interaction
- Extension representation in subscription state

---

## Production validation checklist

After deploy + Supabase migration:

- [ ] `POST /api/generate` returns non-404
- [ ] Audio Sample resolves to **3 credits** server-side
- [ ] `count=3` → 9 credits reserved
- [ ] Success consumes reservation; failure restores
- [ ] Idempotency key prevents duplicate charge
- [ ] Response includes `credits.remaining`
- [ ] Frontend `refreshCredits()` reflects backend state
- [ ] `generation_logs` insert succeeds (service role)
