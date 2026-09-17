/**
 * P4-B — Unified generation contract (frontend).
 *
 * This is the integration seam for SoundCraft / MidiCraft / VSTCraft /
 * MusCraft and Hugging Face Lite models. It describes request/response
 * shapes only. The live path still goes through `generationGateway`
 * (protected); these types let future provider adapters plug in without
 * rewriting Generator UI.
 */

export type AssetType = "audio" | "midi" | "vst_preset" | "mus";

export type GenerationMode = "lite" | "pro";

export type GenerationStatus =
  | "idle"
  | "validating"
  | "queued"
  | "generating"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "preview";

export type ResultOrigin = "backend" | "demo";

export interface GenerationRequest {
  requestId: string;
  generationId: string;
  userId: string | null;
  projectId: string | null;
  assetType: AssetType;
  prompt: string;
  model: string;
  count: number;
  format: string;
  mode: GenerationMode;
  /** Follow-up lineage: the batch this request regenerates/varies, if any. */
  parentGenerationId?: string | null;
  parameters?: Record<string, string | number | boolean>;
}

export interface GeneratedAssetDescriptor {
  id: string;
  type: AssetType;
  name: string;
  format: string;
  url?: string | null;
  previewUrl?: string | null;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
  /** Never a fabricated production URL: demo assets carry demo URLs only. */
  source: ResultOrigin;
}

export interface GenerationResponse {
  generationId: string;
  status: Extract<GenerationStatus, "completed" | "preview" | "failed" | "cancelled">;
  provider: string;
  model: string;
  assets: GeneratedAssetDescriptor[];
  credits?: { consumed: number; remaining: number; balance: number; reserved: number };
  warning?: string;
  error?: ProviderErrorDescriptor;
}

export type ProviderErrorCategory =
  | "configuration"
  | "authentication"
  | "rate_limit"
  | "timeout"
  | "validation"
  | "provider_unavailable"
  | "generation_failed"
  | "invalid_response"
  | "insufficient_credits"
  | "unknown";

export interface ProviderErrorDescriptor {
  code: string;
  provider: string;
  category: ProviderErrorCategory;
  /** True only when a same-key retry is safe (idempotent). Never true for
      validation, authentication, or insufficient-credits errors. */
  retryable: boolean;
  /** User-safe message. Never contains secrets or infrastructure internals. */
  message: string;
  details?: string;
}

export type ProviderAvailability =
  | "available"
  | "unavailable"
  | "misconfigured"
  | "maintenance"
  | "unknown";

export interface ProviderCapabilities {
  provider: string;
  assetTypes: AssetType[];
  formats: string[];
  modes: GenerationMode[];
  models: string[];
  /** Configuration-driven. Unavailable functionality is never marked available. */
  status: ProviderAvailability;
  /** Human-readable reason when status is not available (no internals). */
  statusReason?: string;
}

export interface ProviderHealth {
  provider: string;
  configured: boolean;
  authenticated: boolean;
  reachable: boolean;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  providers: ProviderHealth[];
  timestamp: string;
}
