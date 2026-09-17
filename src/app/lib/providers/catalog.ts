import type { ProviderCapabilities } from "../../types/generation";
import { modelsForType } from "../generation/models";
import { providerAvailability, type KnownProvider } from "./availability";

/**
 * P4-B — Provider capability map. Configuration-driven: capabilities list
 * what each provider *can* do; availability says whether it is live now.
 * Unavailable functionality is never marked available.
 */

const FORMATS: Record<string, string[]> = {
  SoundCraft: ["WAV", "FLAC", "OGG", "MP3"],
  MidiCraft: ["MIDI"],
  VSTCraft: [
    "VST3 (.vstpreset)",
    "VST2 (.fxp)",
    "VST Bank (.fxb)",
    "Serum (.fxp)",
    "Vital (.vital)",
    "Massive (.nmsv)",
    "Ableton Rack (.adv)",
    "Logic Pro (.aupreset)",
  ],
  MusCraft: ["WAV", "MIDI"],
  HuggingFaceLite: ["MP3"],
};

function liteModels(): string[] {
  return modelsForType("Audio Sample", "lite").map((m) => m.id);
}

export function capabilitiesFor(provider: KnownProvider): ProviderCapabilities {
  const { status, reason } = providerAvailability(provider);
  switch (provider) {
    case "SoundCraft":
      return {
        provider,
        assetTypes: ["audio"],
        formats: FORMATS.SoundCraft,
        modes: ["pro"],
        models: ["SoundCraft"],
        status,
        statusReason: reason,
      };
    case "MidiCraft":
      return {
        provider,
        assetTypes: ["midi"],
        formats: FORMATS.MidiCraft,
        modes: ["pro"],
        models: ["MidiCraft"],
        status,
        statusReason: reason,
      };
    case "VSTCraft":
      return {
        provider,
        assetTypes: ["vst_preset"],
        formats: FORMATS.VSTCraft,
        modes: ["pro"],
        models: ["VSTCraft"],
        status,
        statusReason: reason,
      };
    case "MusCraft":
      // Future modular music/audio capability: boundary exists, no models
      // registered, never reported as available.
      return {
        provider,
        assetTypes: ["mus"],
        formats: FORMATS.MusCraft,
        modes: ["pro"],
        models: [],
        status,
        statusReason: "MusCraft models are not registered yet.",
      };
    case "HuggingFaceLite":
      return {
        provider,
        assetTypes: ["audio"],
        formats: FORMATS.HuggingFaceLite,
        modes: ["lite"],
        models: liteModels(),
        status,
        statusReason: reason,
      };
    default:
      return {
        provider: "orchestration",
        assetTypes: ["audio", "midi", "vst_preset"],
        formats: [],
        modes: ["lite", "pro"],
        models: [],
        status,
        statusReason: reason,
      };
  }
}

export const KNOWN_PROVIDERS: KnownProvider[] = [
  "SoundCraft",
  "MidiCraft",
  "VSTCraft",
  "MusCraft",
  "HuggingFaceLite",
];

export function allCapabilities(): ProviderCapabilities[] {
  return KNOWN_PROVIDERS.map(capabilitiesFor);
}
