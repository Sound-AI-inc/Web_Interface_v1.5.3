import type { ProviderAvailability, ProviderCapabilities } from "../../src/app/types/generation";

export const PROVIDER_ENV_KEYS = {
  orchestration: "SOUNDAI_INTERNAL_INFERENCE_URL",
  SoundCraft: "SOUNDAI_INTERNAL_INFERENCE_URL",
  MidiCraft: "SOUNDAI_INTERNAL_INFERENCE_URL",
  VSTCraft: "SOUNDAI_INTERNAL_INFERENCE_URL",
  MusCraft: "SOUNDAI_INTERNAL_INFERENCE_URL",
} as const;

export type KnownProvider = keyof typeof PROVIDER_ENV_KEYS | "HuggingFaceLite" | "RunPod";

export function readEnv(name: string, env: Record<string, unknown>): string | undefined {
  const value = env[name];
  return typeof value === "string" ? value.trim() : undefined;
}

export function getProviderConfig(env: Record<string, unknown>): Record<string, ProviderConfig> {
  const hfApiKey = readEnv("HF_API_KEY", env);
  const hfInferenceBaseUrl = readEnv("HUGGINGFACE_INFERENCE_BASE_URL", env);
  const runpodApiKey = readEnv("RUNPOD_API_KEY", env);
  const runpodApiUrl = readEnv("RUNPOD_API_URL", env);

  const proEndpointBaseUrl = readEnv(PROVIDER_ENV_KEYS.orchestration, env);

  return {
    SoundCraft: {
      provider: "SoundCraft",
      endpointConfigured: Boolean(proEndpointBaseUrl),
      authenticationConfigured: true,
      capabilities: getSoundCraftCapabilities(),
      status: proEndpointBaseUrl ? "unknown" : "misconfigured",
      statusReason: proEndpointBaseUrl ? "Configured; liveness requires a health check." : "SOUNDAI_INTERNAL_INFERENCE_URL is not set.",
    },
    MidiCraft: {
      provider: "MidiCraft",
      endpointConfigured: Boolean(proEndpointBaseUrl),
      authenticationConfigured: true,
      capabilities: getMidiCraftCapabilities(),
      status: proEndpointBaseUrl ? "unknown" : "misconfigured",
      statusReason: proEndpointBaseUrl ? "Configured; liveness requires a health check." : "SOUNDAI_INTERNAL_INFERENCE_URL is not set.",
    },
    VSTCraft: {
      provider: "VSTCraft",
      endpointConfigured: Boolean(proEndpointBaseUrl),
      authenticationConfigured: true,
      capabilities: getVSTCraftCapabilities(),
      status: proEndpointBaseUrl ? "unknown" : "misconfigured",
      statusReason: proEndpointBaseUrl ? "Configured; liveness requires a health check." : "SOUNDAI_INTERNAL_INFERENCE_URL is not set.",
    },
    MusCraft: {
      provider: "MusCraft",
      endpointConfigured: false,
      authenticationConfigured: false,
      capabilities: getMusCraftCapabilities(),
      status: "misconfigured",
      statusReason: "MusCraft models are not registered yet.",
    },
    HuggingFaceLite: {
      provider: "HuggingFaceLite",
      endpointConfigured: Boolean(hfInferenceBaseUrl || proEndpointBaseUrl),
      authenticationConfigured: Boolean(hfApiKey || proEndpointBaseUrl),
      capabilities: getHuggingFaceLiteCapabilities(),
      status: (hfInferenceBaseUrl || proEndpointBaseUrl) ? "unknown" : "misconfigured",
      statusReason: (hfInferenceBaseUrl || proEndpointBaseUrl) ? "Configured; liveness requires a health check." : "Inference endpoint not connected.",
    },
    RunPod: {
      provider: "RunPod",
      endpointConfigured: Boolean(runpodApiUrl),
      authenticationConfigured: Boolean(runpodApiKey),
      capabilities: getRunPodCapabilities(),
      status: runpodApiUrl ? "unknown" : "misconfigured",
      statusReason: runpodApiUrl ? "Configured; liveness requires a health check." : "RUNPOD_API_URL is not set.",
    },
  };
}

export interface ProviderConfig {
  provider: string;
  endpointConfigured: boolean;
  authenticationConfigured: boolean;
  capabilities: ProviderCapabilities;
  status: ProviderAvailability;
  statusReason: string;
}

function getSoundCraftCapabilities(): ProviderCapabilities {
  return {
    provider: "SoundCraft",
    assetTypes: ["audio"],
    formats: ["WAV", "FLAC", "OGG", "MP3"],
    modes: ["pro"],
    models: ["SoundCraft"],
    status: "misconfigured",
    statusReason: "Not configured",
  };
}

function getMidiCraftCapabilities(): ProviderCapabilities {
  return {
    provider: "MidiCraft",
    assetTypes: ["midi"],
    formats: ["MIDI"],
    modes: ["pro"],
    models: ["MidiCraft"],
    status: "misconfigured",
    statusReason: "Not configured",
  };
}

function getVSTCraftCapabilities(): ProviderCapabilities {
  return {
    provider: "VSTCraft",
    assetTypes: ["vst_preset"],
    formats: [
      "VST3 (.vstpreset)",
      "VST2 (.fxp)",
      "VST Bank (.fxb)",
      "Serum (.fxp)",
      "Vital (.vital)",
      "Massive (.nmsv)",
      "Ableton Rack (.adv)",
      "Logic Pro (.aupreset)",
    ],
    modes: ["pro"],
    models: ["VSTCraft"],
    status: "misconfigured",
    statusReason: "Not configured",
  };
}

function getMusCraftCapabilities(): ProviderCapabilities {
  return {
    provider: "MusCraft",
    assetTypes: ["mus"],
    formats: ["WAV", "MIDI"],
    modes: ["pro"],
    models: [],
    status: "misconfigured",
    statusReason: "MusCraft models are not registered yet.",
  };
}

function getHuggingFaceLiteCapabilities(): ProviderCapabilities {
  return {
    provider: "HuggingFaceLite",
    assetTypes: ["audio"],
    formats: ["MP3", "WAV"],
    modes: ["lite"],
    models: [
      "facebook/musicgen-small",
      "facebook/audiogen-medium",
      "stabilityai/stable-audio-open-small",
      "chinedudave06/musicgen-small-onnx",
    ],
    status: "misconfigured",
    statusReason: "Not configured",
  };
}

function getRunPodCapabilities(): ProviderCapabilities {
  return {
    provider: "RunPod",
    assetTypes: ["audio", "midi", "vst_preset"],
    formats: ["WAV", "FLAC", "OGG", "MP3", "MIDI"],
    modes: ["pro"],
    models: [],
    status: "misconfigured",
    statusReason: "Not configured",
  };
}

export function providerAvailabilityFromConfig(config: ProviderConfig): { status: ProviderAvailability; reason?: string } {
  return { status: config.status, reason: config.statusReason };
}