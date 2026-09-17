import type { ProviderAvailability, ProviderCapabilities, ProviderErrorDescriptor } from "../../types/generation";
import { providerAvailability, readEnv, type KnownProvider } from "./availability";
import { capabilitiesFor } from "./catalog";
import { normalizeProviderError } from "./errors";
import { DEFAULT_PROVIDER_POLICY, type ProviderAdapter, type ProviderPolicy } from "./types";

/**
 * P4-B — Provider adapter descriptors. Each adapter is a configuration +
 * capability + error boundary for one inference provider. They perform no
 * network I/O and are not wired into the live path (the protected
 * `generationGateway` owns today's routing); they exist so provider
 * integration and a future orchestrator can land without UI rewrites.
 */

function makeAdapter(provider: KnownProvider): ProviderAdapter {
  return {
    provider,
    capabilities(): ProviderCapabilities {
      return capabilitiesFor(provider);
    },
    validateConfig(): { ok: boolean; missing: string[] } {
      if (provider === "HuggingFaceLite") {
        const ok = Boolean(readEnv("VITE_AI_GENERATION_API_URL") || readEnv("VITE_SOUNDCRAFT_API_URL"));
        return ok ? { ok: true, missing: [] } : { ok: false, missing: ["VITE_AI_GENERATION_API_URL"] };
      }
      if (provider === "MusCraft") {
        return { ok: false, missing: ["VITE_MUSCRAFT_API_URL", "registered MusCraft models"] };
      }
      const key =
        provider === "SoundCraft"
          ? "VITE_SOUNDCRAFT_API_URL"
          : provider === "MidiCraft"
            ? "VITE_MIDICRAFT_API_URL"
            : "VITE_VSTCRAFT_API_URL";
      const ok = Boolean(readEnv(key) || readEnv("VITE_AI_GENERATION_API_URL"));
      return ok ? { ok: true, missing: [] } : { ok: false, missing: [key] };
    },
    availability(): ProviderAvailability {
      return providerAvailability(provider).status;
    },
    normalizeError(raw: unknown): ProviderErrorDescriptor {
      return normalizeProviderError(provider, raw);
    },
    policy(): ProviderPolicy {
      return { ...DEFAULT_PROVIDER_POLICY };
    },
  };
}

export const soundCraftAdapter: ProviderAdapter = makeAdapter("SoundCraft");
export const midiCraftAdapter: ProviderAdapter = makeAdapter("MidiCraft");
export const vstCraftAdapter: ProviderAdapter = makeAdapter("VSTCraft");
export const musCraftAdapter: ProviderAdapter = makeAdapter("MusCraft");
export const huggingFaceLiteAdapter: ProviderAdapter = makeAdapter("HuggingFaceLite");

export const providerAdapters: ProviderAdapter[] = [
  soundCraftAdapter,
  midiCraftAdapter,
  vstCraftAdapter,
  musCraftAdapter,
  huggingFaceLiteAdapter,
];

export function adapterFor(provider: string): ProviderAdapter | undefined {
  return providerAdapters.find((adapter) => adapter.provider === provider);
}
