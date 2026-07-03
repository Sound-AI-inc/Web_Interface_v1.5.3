# SoundAI Workspace — Technical Audit Report

**Project:** `soundai-web-interface_v1.6`  
**Date:** 2026-07-03  
**Scope:** Full frontend, UX, auth, Supabase, generation workflow

---

## 1. Bug Report

### Critical (fixed in this sprint)

| ID | Issue | Status |
|----|-------|--------|
| C1 | Onboarding shown to existing users on sign-in | Fixed — signup-only flag + account age heuristic |
| C2 | Onboarding finish button blocked on Supabase | Fixed — local-first save, async sync |
| C3 | AppLayout redirect loop after onboarding | Fixed — bypass flag + sync localStorage check |
| C4 | Sidebar shows hardcoded user (not session) | Fixed — wired to `useAuth()` |

### High (fixed in this sprint)

| ID | Issue | Status |
|----|-------|--------|
| H1 | Generation credits charged for N variants but API returns 1 | Fixed — charge `min(requested, actual)` |
| H2 | `recordGenerationHistory` used stale `projectId` | Fixed — read from created chat |
| H3 | ResultCard hardcoded BPM/key metadata | Fixed — reads from `item.metadata` |
| H4 | Generation results looked like dashboard widgets | Fixed — conversation artifact redesign |
| H5 | Credits rollback used stale closure values | Fixed — capture previous balance before optimistic update |

### High (open — needs follow-up)

| ID | Issue | Recommendation |
|----|-------|----------------|
| H6 | Client-side credit deduct without server validation | Move deduct to `/api/generate` only; client read-only |
| H7 | Double billing risk (client + API `consumeCredits`) | Single source of truth on server |
| H8 | Auth bypass when Supabase env missing | Fail closed in production builds |
| H9 | Share links (`?share=`) copied but never consumed | Implement deep-link handler or remove UI |

### Medium (open)

| ID | Issue |
|----|-------|
| M1 | `ResultsList.tsx` unused dead component |
| M2 | Profile page uses mock data, not Supabase profile |
| M3 | Lite-locked routes reachable by direct URL |
| M4 | `window.alert` / `confirm` in workspace nav |
| M5 | Persist migration drops in-progress empty chats |
| M6 | OAuth always redirects sign-in correctly but email sign-up without session skips onboarding flag |

### Low (open)

| ID | Issue |
|----|-------|
| L1 | Hardcoded colors in `AnimatedBackground`, demo gradients |
| L2 | Inconsistent import paths (`mock` vs `contracts`) |
| L3 | Sidebar collapsed mode hides chat/project list |
| L4 | `.env.example` missing `VITE_AI_GENERATION_API_URL` |

---

## 2. UX Improvement Report

### Completed
- Generation feed uses **conversation artifacts** (ChatGPT/Linear-style) instead of nested cards
- Assistant bubble de-emphasized — transparent container, asset is focal point
- Secondary actions (Save, Reuse, Favorite, Edit) use minimal ghost buttons
- Project assignment moved to artifact footer
- Real metadata (BPM, key, duration) instead of placeholder strings

### Recommended next
- Unify empty states across Library, Export, Prompts with shared component
- Replace blocking alerts with toast system
- Add keyboard shortcut for composer focus (partially exists)
- Skeleton loaders aligned to artifact shape (not bordered boxes)
- Consistent Pro gate at route level, not only page component

---

## 3. Performance Report

| Area | Finding | Priority |
|------|---------|----------|
| AudioGenerator | Re-renders on every workspace store change | Memoize `GenerationTimeline` |
| Waveform | Canvas resize on every progress tick | Acceptable for MVP |
| Lazy routes | All pages lazy-loaded via `App.tsx` | Good |
| Zustand persist | Workspace v4 migration on every hydrate | Monitor size |
| Supabase | Onboarding fetch had 6s timeout blocking UI | Fixed with local-first |

---

## 4. Refactoring Report

| Action | Target |
|--------|--------|
| **Delete** | `ResultsList.tsx` (unused) |
| **Split** | `AudioGenerator.tsx` → timeline, composer, hooks |
| **Extract hook** | `useGenerationPipeline()` from AudioGenerator |
| **Merge** | Duplicate asset action buttons in feed/library |
| **Simplify** | Credits: single `CreditsProvider` with server sync |
| **Context** | Consider merging interface mode + theme at layout level |

---

## 5. Security Report

| Area | Status | Notes |
|------|--------|-------|
| Supabase Auth | OK | Session persisted, refresh enabled |
| Protected routes | Partial | AppLayout gates `/app/*`; demo mode bypass if no env |
| RLS onboarding | OK | User-scoped policies + grants |
| Credits | **Risk** | Client can manipulate balance via upsert if RLS weak |
| API `/api/generate` | OK | Bearer JWT validation |
| Env vars | OK | Anon key only in client; no service role exposed |
| Session | OK | `signOut` clears session |

**Recommendation:** Enforce credit deduction exclusively in `api/generate.ts` with Postgres RPC or row-level locking.

---

## 6. Registration Pipeline (target state)

```
Sign Up → ensureSignupCredits → markNeedsOnboarding → Onboarding → Workspace
Sign In → /app/generator (skip onboarding if existing user)
```

Default project seeded in `workspaceStore` persist. First chat created on first successful generation (by design).

---

## Pages audited

| Page | Auth | Tokens | Empty states | Notes |
|------|------|--------|--------------|-------|
| AudioGenerator | ✓ | ✓ | ✓ | Primary focus of this sprint |
| Onboarding | ✓ | ✓ | — | Fixed gating |
| Library | Pro gate | ✓ | Partial | |
| Export | Pro gate | ✓ | Partial | |
| Prompts | ✓ | ✓ | ✓ | |
| Settings | ✓ | ✓ | — | |
| Billing | ✓ | Mixed | — | |
| Profile | ✗ mock | Mixed | — | Needs Supabase wiring |

---

## Outcome

This sprint moves the workspace toward a **unified AI creative OS** feel:
- Conversation-native generation results
- Correct auth/onboarding segmentation
- Accurate credits for actual output count
- Real user identity in sidebar

Next priority: **server-side credits** + **Profile/Supabase sync** + **route-level Pro guards**.
