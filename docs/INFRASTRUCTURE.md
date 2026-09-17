# SoundAI Infrastructure Documentation

This document describes the provider infrastructure for SoundAI's AI inference system, covering provider adapters, health checks, smoke tests, and operational procedures.

## Architecture Overview

```
Client (React + Vite)
    │
    ▼
Cloudflare Worker (/api/generate, /api/credits, /api/health)
    │
    ├──► /api/generate ──► Provider Router ──► Provider Adapters ──► Inference Endpoints
    │                                            │
    │                                            ├── SoundCraft (internal)
    │                                            ├── MidiCraft (internal)
    │                                            ├── VSTCraft (internal)
    │                                            ├── MusCraft (future)
    │                                            ├── HuggingFaceLite (HF Inference API)
    │                                            └── RunPod (custom deployments)
    │
    ├──► /api/credits ──► Supabase Credit Engine
    │
    └──► /api/health ──► Provider Health Checks
```

## Provider Endpoints

### Internal Orchestration (SoundCraft, MidiCraft, VSTCraft)
- **Environment Variable**: `SOUNDAI_INTERNAL_INFERENCE_URL`
- **Health Endpoint**: `{baseUrl}/health`
- **Authentication**: Internal network / API gateway
- **Asset Types**: audio, midi, vst_preset
- **Formats**: WAV, FLAC, OGG, MP3, MIDI, VST3, VST2, Serum, Vital, Massive, Ableton Rack, Logic Pro

### HuggingFaceLite
- **Environment Variables**: 
  - `HF_API_KEY` — Hugging Face API token
  - `HUGGINGFACE_INFERENCE_BASE_URL` — Optional custom endpoint (defaults to `https://api-inference.huggingface.co`)
- **Health Check**: `HEAD {baseUrl}/models/facebook/musicgen-small`
- **Models**: 
  - `facebook/musicgen-small`
  - `facebook/audiogen-medium`
  - `stabilityai/stable-audio-open-small`
  - `chinedudave06/musicgen-small-onnx`
- **Asset Types**: audio
- **Formats**: MP3, WAV
- **Mode**: lite (consumes fewer credits)

### RunPod
- **Environment Variables**:
  - `RUNPOD_API_KEY` — RunPod API token
  - `RUNPOD_API_URL` — RunPod endpoint URL
- **Health Endpoint**: `{RUNPOD_API_URL}/health`
- **Asset Types**: audio, midi, vst_preset
- **Formats**: WAV, FLAC, OGG, MP3, MIDI
- **Mode**: pro

## Environment Variables

### Client-Side (VITE_*)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_WEBSITE_URL` | Yes | Production website URL |
| `VITE_AI_GENERATION_API_URL` | No | Worker URL (defaults to `/api/generate`) |
| `VITE_SOUNDCRAFT_API_URL` | No | Legacy direct endpoint |
| `VITE_MIDICRAFT_API_URL` | No | Legacy direct endpoint |
| `VITE_VSTCRAFT_API_URL` | No | Legacy direct endpoint |

### Server-Side (Worker)
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for credit operations |
| `HF_API_KEY` | For HF | Hugging Face API token |
| `HUGGINGFACE_INFERENCE_BASE_URL` | No | Custom HF inference endpoint |
| `SOUNDAI_INTERNAL_INFERENCE_URL` | For Pro | Internal orchestration endpoint |
| `RUNPOD_API_KEY` | For RunPod | RunPod API token |
| `RUNPOD_API_URL` | For RunPod | RunPod endpoint URL |
| `AI_INFERENCE_TIMEOUT_MS` | No | Request timeout (default: 60000) |
| `AI_INFERENCE_RETRIES` | No | Retry attempts (default: 2) |
| `GENERATION_CACHE_TTL_SECONDS` | No | Cache TTL (default: 3600) |
| `ENTERPRISE_RATE_LIMIT_PER_MINUTE` | No | Rate limit (default: 120) |
| `UPSTASH_REDIS_REST_URL` | No | Redis for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Redis token |

## Provider Health Checks

### Endpoint
```
GET /api/health
```

### Response
```json
{
  "healthy": true,
  "providers": [
    {
      "provider": "SoundCraft",
      "configured": true,
      "authenticated": true,
      "reachable": true,
      "healthy": true,
      "latencyMs": 45,
      "error": null
    }
  ],
  "timestamp": "2026-09-16T15:00:00.000Z"
}
```

### Provider Status Values
- `available` — Fully operational
- `unavailable` — Configured but unreachable/unhealthy
- `misconfigured` — Missing required environment variables
- `maintenance` — Explicitly marked for maintenance
- `unknown` — Configured but health check not yet run

## CLI Commands

### providers:check
Validates environment variable presence and fixture contracts (no network I/O).
```bash
npm run providers:check
```
- Exits 0 if all required vars present and fixtures valid
- Exits 1 with details if any missing or invalid
- Safe to run in CI without secrets

### providers:health
Performs live health checks against configured provider endpoints.
```bash
npm run providers:health
```
- Requires server-side env vars to be set
- Performs actual HTTP requests to health endpoints
- Exits 1 if any configured provider is unhealthy
- Use for pre-deployment validation

### providers:smoke
Runs end-to-end smoke generation requests via local worker.
```bash
npm run providers:smoke
```
- Requires `wrangler dev` running on `http://localhost:8787`
- Requires valid server-side credentials
- Tests full path: client → worker → adapter → inference → response
- Exits 1 if any smoke test fails

## Credit Integration

Generation requests flow through `/api/generate` which:
1. Validates request and calculates credit cost
2. Reserves credits via `creditsService.reserve()`
3. Routes to appropriate provider adapter
4. On success: consumes reserved credits via `creditsService.consume()`
5. On failure: restores credits via `creditsService.restore()`

Credit costs are defined per provider/model in the provider adapter layer.

## Deployment

### Cloudflare Workers
```bash
npm run deploy:cloudflare
```
- Builds client (`vite build`)
- Deploys worker via Wrangler

### Preview Deployment
```bash
npm run deploy:cloudflare:preview
```
- Deploys to preview environment

### Local Development
```bash
npm run dev
```
- Starts Vite dev server
- Worker runs via Wrangler on separate port

## Provider Adapter Contract

All provider adapters implement:
```typescript
interface ProviderAdapter {
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  getCapabilities(): ProviderCapabilities;
  checkHealth(): Promise<ProviderHealth>;
}
```

Error normalization follows `ProviderErrorDescriptor` with categories:
- `configuration`, `authentication`, `rate_limit`, `timeout`
- `validation`, `provider_unavailable`, `generation_failed`
- `invalid_response`, `insufficient_credits`, `unknown`

## Current Provider Status (2026-09-16)

| Provider          | Implemented | Configured | Live Validated | Status |
|-------------------|-------------|------------|----------------|--------|
| SoundCraft        | ✅          | ❌         | ❌             | NOT_CONFIGURED |
| MidiCraft         | ✅          | ❌         | ❌             | NOT_CONFIGURED |
| VSTCraft          | ✅          | ❌         | ❌             | NOT_CONFIGURED |
| MusCraft          | ✅          | ❌         | ❌             | DEFERRED (no models registered) |
| HuggingFaceLite   | ✅          | ❌         | ❌             | NOT_CONFIGURED |
| RunPod            | ✅          | ❌         | ❌             | NOT_CONFIGURED |

**Legend:**
- **IMPLEMENTED** — Adapter code exists, worker routing wired, health/smoke scripts support it
- **CONFIGURED** — Server-side env vars present in `.dev.vars` / Cloudflare secrets
- **LIVE VALIDATED** — `providers:health` and `providers:smoke` pass against real endpoints
- **NOT_CONFIGURED** — Infrastructure ready, awaiting credentials/endpoints
- **DEFERRED** — Intentionally not provisioned (no models registered)

### Validation Results (2026-09-16)

```
npm run providers:check   → 4 missing client-side VITE_* vars (expected in dev)
npm run providers:health  → All providers SKIPPED — NOT_CONFIGURED
npm run providers:smoke   → All providers SKIPPED — NOT_CONFIGURED
```

To enable live validation, configure in `.dev.vars` (local) or Cloudflare dashboard (production):
- `SOUNDAI_INTERNAL_INFERENCE_URL` for SoundCraft/MidiCraft/VSTCraft
- `HF_API_KEY` (+ optional `HUGGINGFACE_INFERENCE_BASE_URL`) for HuggingFaceLite
- `RUNPOD_API_KEY` + `RUNPOD_API_URL` for RunPod

## Troubleshooting

### Provider shows "misconfigured"
- Check required environment variables are set in Cloudflare dashboard
- Verify variable names match exactly (case-sensitive)

### Health check fails with "Authentication failed"
- Verify `HF_API_KEY` or `RUNPOD_API_KEY` is valid
- Check token permissions/scopes

### Smoke test times out
- Increase `AI_INFERENCE_TIMEOUT_MS`
- Check inference endpoint responsiveness
- Verify `wrangler dev` is running

### No providers configured for smoke tests
- Set at least one of: `SOUNDAI_INTERNAL_INFERENCE_URL`, `HF_API_KEY` + `HUGGINGFACE_INFERENCE_BASE_URL`, `RUNPOD_API_URL`
- Ensure `.dev.vars` or `.env` has the values for local development

## Security Notes

- **Never** commit real secrets to version control
- Server-side variables must **never** be prefixed with `VITE_`
- Client-side `VITE_*` variables are embedded in the build
- Use Cloudflare dashboard secrets for production deployment
- Run `providers:check` in CI to detect leaked secrets