/**
 * P4-B — Provider integration seam (public barrel).
 * UI code should import from here, never from individual provider internals.
 */
export type {
  AssetType,
  GeneratedAssetDescriptor,
  GenerationMode,
  GenerationRequest,
  GenerationResponse,
  GenerationStatus,
  ProviderAvailability,
  ProviderCapabilities,
  ProviderErrorCategory,
  ProviderErrorDescriptor,
  ResultOrigin,
} from "../../types/generation";
export type { ProviderAdapter, ProviderPolicy } from "./types";
export { DEFAULT_PROVIDER_POLICY } from "./types";
export { KNOWN_PROVIDERS, allCapabilities, capabilitiesFor } from "./catalog";
export { PROVIDER_ENV_KEYS, providerAvailability, readEnv, type KnownProvider } from "./availability";
export { isRetryableCategory, normalizeProviderError } from "./errors";
export {
  adapterFor,
  huggingFaceLiteAdapter,
  midiCraftAdapter,
  musCraftAdapter,
  providerAdapters,
  soundCraftAdapter,
  vstCraftAdapter,
} from "./adapters";
