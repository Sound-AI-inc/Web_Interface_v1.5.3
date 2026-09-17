import type { ProviderAvailability } from "../../types/generation";

/**
 * P4-B — Provider availability abstraction. Static (no network): resolved
 * from configuration presence only. "unknown" means configured but liveness
 * unproven — only the health script or a real request can promote it.
 * Never reports success without evidence.
 */

export function readEnv(name: string): string | undefined {
  if (typeof import.meta === "undefined") return undefined;
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return value?.trim() || undefined;
}

export const PROVIDER_ENV_KEYS = {
  orchestration: "VITE_AI_GENERATION_API_URL",
  SoundCraft: "VITE_SOUNDCRAFT_API_URL",
  MidiCraft: "VITE_MIDICRAFT_API_URL",
  VSTCraft: "VITE_VSTCRAFT_API_URL",
  MusCraft: "VITE_MUSCRAFT_API_URL",
} as const;

export type KnownProvider = keyof typeof PROVIDER_ENV_KEYS | "HuggingFaceLite";

export function providerAvailability(provider: KnownProvider): {
  status: ProviderAvailability;
  reason?: string;
} {
  if (provider === "HuggingFaceLite") {
    // Browser builds never hold the HF key; inference is server-managed.
    if (readEnv("VITE_AI_GENERATION_API_URL") || readEnv("VITE_SOUNDCRAFT_API_URL")) {
      return { status: "unknown", reason: "Configured; liveness requires a health check." };
    }
    return { status: "misconfigured", reason: "Inference endpoint not connected." };
  }
  const key = PROVIDER_ENV_KEYS[provider as keyof typeof PROVIDER_ENV_KEYS];
  if (readEnv(key) || readEnv(PROVIDER_ENV_KEYS.orchestration)) {
    return { status: "unknown", reason: "Configured; liveness requires a health check." };
  }
  return { status: "misconfigured", reason: `${key} is not set.` };
}
