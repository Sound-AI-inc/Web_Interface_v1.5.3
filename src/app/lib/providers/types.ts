import type {
  GenerationRequest,
  GenerationResponse,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderErrorCategory,
  ProviderErrorDescriptor,
} from "../../types/generation";

/**
 * P4-B — Provider adapter boundary.
 *
 * Each inference provider (SoundCraft, MidiCraft, VSTCraft, MusCraft,
 * Hugging Face Lite) gets an adapter implementing this interface. The
 * Generator UI talks only to the generation layer; provider routing lives
 * here (and today, in the protected `generationGateway`). A future AI
 * Orchestrator sits above these adapters for model selection.
 *
 * Adapters never expose proprietary internals and never fabricate output:
 * unavailable means unavailable.
 */
export interface ProviderAdapter {
  readonly provider: string;
  capabilities(): ProviderCapabilities;
  /** Static configuration validation (env present, shapes sane). */
  validateConfig(): { ok: boolean; missing: string[] };
  /** Current best-known availability without side effects. */
  availability(): ProviderAvailability;
  normalizeError(raw: unknown): ProviderErrorDescriptor;
  /** Timeout/retry policy hints for future runtimes. Controlled and
      idempotency-aware: never retry validation, auth, or credit errors. */
  policy(): ProviderPolicy;
}

export interface ProviderPolicy {
  timeoutMs: number;
  maxRetries: number;
  retryableCategories: ProviderErrorCategory[];
}

export const DEFAULT_PROVIDER_POLICY: ProviderPolicy = {
  timeoutMs: 60_000,
  maxRetries: 2,
  retryableCategories: ["timeout", "rate_limit", "provider_unavailable", "generation_failed"],
};

export type { GenerationRequest, GenerationResponse };
