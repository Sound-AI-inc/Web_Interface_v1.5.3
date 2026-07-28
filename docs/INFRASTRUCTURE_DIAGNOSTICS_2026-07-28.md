# SoundAI Infrastructure Diagnostics - 2026-07-28

## Scope

Audited the locally available SoundAI Web Interface repository on branch `Preview-tests`.
The separate SoundAI Website repository was not present as a usable git checkout in the
available workspace roots, so no Website branch or code changes could be made from this
session.

## Deployment Architecture

The Web Interface is a Vite React SPA intended for Cloudflare Pages with static output in
`dist`.

Evidence:

- `vite.config.ts` uses the standard Vite React setup and default `dist` output.
- `package.json` builds with `tsc -b && vite build`.
- `public/_redirects` intentionally avoids catch-all redirect rules to prevent Cloudflare
  redirect loops.
- No `wrangler.toml` or `wrangler.jsonc` existed before this sprint, which explains
  Wrangler's `Missing entry-point to Worker script or to assets directory` failure.

Restored configuration:

- Added `wrangler.toml` with `pages_build_output_dir = "dist"`.
- Added `deploy:cloudflare` script: `npm run build && wrangler pages deploy dist`.
- Preserved Vite, React Router, and current SPA routing behavior.

## Critical Issues

1. Wrangler had no deployment target.
   - Root cause: missing Cloudflare configuration, not `_redirects`.
   - Fix: added explicit Cloudflare Pages output configuration.

2. Onboarding completion was not guaranteed to persist to Supabase before workspace entry.
   - Root cause: Supabase save was fire-and-forget while local storage was marked complete
     immediately.
   - Fix: questionnaire and guided tour status now await Supabase persistence before
     updating local cache and continuing.

3. Credits data model is split.
   - Server-side generation deducts from `generation_credit_balances`.
   - Client billing UI still grants/mock-updates `user_credits`.
   - Recommendation: unify billing and display reads around the server-side credits tables
     or add a server endpoint for billing credit grants.

## Medium Issues

1. Cloudflare Pages Functions are not present.
   - Existing server API code is in Vercel-style `api/generate.ts` using Node
     `IncomingMessage`/`ServerResponse`.
   - If `/api/generate` must run on Cloudflare Pages, it should be ported to
     `functions/api/generate.ts` or deployed as a separate Worker with compatible runtime
     APIs.

2. OAuth provider enablement cannot be verified locally.
   - Google and Spotify calls are wired through Supabase.
   - Supabase Dashboard must include localhost, preview, and production callback URLs.

3. Early Access synchronization is not implemented in the available Web Interface code.
   - No local Early Access table/API contract was found.
   - Recommended server-side matching key: lower-cased email, with idempotent profile
     linking and plan/credit preservation.

4. Lint has pre-existing errors unrelated to this sprint.
   - `src/app/state/libraryStore.ts`: unused `_folder`, `_project`.
   - `src/app/state/workspaceStore.ts`: `let` should be `const`.

## Low Priority Issues

1. `vercel.json` remains in the repo for Vercel preview compatibility.
2. `public/_redirects` contains comments only; Cloudflare Pages SPA fallback should be
   configured through Pages build output and framework behavior.
3. README is still Vite starter documentation and does not describe production deploys.

## Security Recommendations

- Keep `SUPABASE_SERVICE_ROLE_KEY`, inference provider keys, and billing secrets only in
  Cloudflare secrets/server runtime.
- Do not expose service role keys through `VITE_` variables.
- Add Supabase RLS migration checks to CI.
- Configure Supabase Auth redirect allow-list for exact localhost, preview, and production
  origins.
- Move billing credit grants behind a server endpoint or webhook.

## Performance Recommendations

- Keep long-lived static asset caching for Vite hashed files.
- Monitor large editor chunks and consider route-level prefetch only for likely next routes.
- Cache generation responses only for safe Lite/model-compatible requests, as current API
  code already attempts.

## Verification

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: failed on pre-existing lint errors listed above; no new TypeScript
  build failures.

## Remaining Infrastructure Work

1. Apply Supabase SQL migrations in the production project.
2. Add/verify Cloudflare environment variables and secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - inference provider secrets
3. Port `/api/generate` to Cloudflare Pages Functions or confirm it is deployed as a
   separate Worker/API service.
4. Implement server-side Early Access to auth profile linking.
5. Unify credits and billing around the server-side credits pipeline.
6. Fix existing lint debt.
7. Create the Website `Preview-tests` branch once the Website repository is available
   locally.
