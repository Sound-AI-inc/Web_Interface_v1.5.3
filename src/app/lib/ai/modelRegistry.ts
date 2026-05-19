import type { ModelConfig, ModelInputType, ModelOutputType, ModelTier, SoundAIComponent } from "./types";

export const modelRegistry = [
  {
    id: "facebook/musicgen-small",
    component: "SoundCraft",
    tier: "lite",
    provider: "huggingface",
    input_type: "text",
    output_type: "audio",
    license: "CC-BY-NC-4.0",
    commercial_use: false,
  },
  {
    id: "facebook/audiogen-medium",
    component: "SoundCraft",
    tier: "lite",
    provider: "huggingface",
    input_type: "text",
    output_type: "audio",
    license: "CC-BY-NC-4.0",
    commercial_use: false,
  },
  {
    id: "stabilityai/stable-audio-open-small",
    component: "SoundCraft",
    tier: "lite",
    provider: "huggingface",
    input_type: "text",
    output_type: "audio",
    license: "MIT",
    commercial_use: true,
  },
  {
    id: "chinedudave06/musicgen-small-onnx",
    component: "SoundCraft",
    tier: "lite",
    provider: "huggingface",
    input_type: "text",
    output_type: "audio",
    license: "CC-BY-NC-4.0",
    commercial_use: false,
  },
  {
    id: "facebook/encodec_24khz",
    component: "Infrastructure",
    tier: "lite",
    provider: "huggingface",
    input_type: "audio",
    output_type: "audio",
    license: "CC-BY-NC-4.0",
    commercial_use: false,
  },
  {
    id: "facebook/encodec_48khz",
    component: "Infrastructure",
    tier: "lite",
    provider: "huggingface",
    input_type: "audio",
    output_type: "audio",
    license: "MIT",
    commercial_use: true,
  },
  {
    id: "charactr/vocos-encodec-24khz",
    component: "Infrastructure",
    tier: "lite",
    provider: "huggingface",
    input_type: "audio",
    output_type: "audio",
    license: "MIT",
    commercial_use: true,
  },
  {
    id: "PopMusicTransformer",
    component: "MidiCraft",
    tier: "lite",
    provider: "github",
    input_type: "text",
    output_type: "midi",
    license: "MIT",
    commercial_use: true,
  },
  {
    id: "Magenta Music Transformer",
    component: "MidiCraft",
    tier: "lite",
    provider: "github",
    input_type: "text",
    output_type: "midi",
    license: "Apache-2.0",
    commercial_use: true,
  },
  {
    id: "GrooVAE",
    component: "MidiCraft",
    tier: "lite",
    provider: "github",
    input_type: "midi",
    output_type: "midi",
    license: "Apache-2.0",
    commercial_use: true,
  },
  {
    id: "SoundCraft",
    component: "SoundCraft",
    tier: "pro",
    provider: "internal",
    input_type: "text",
    output_type: "audio",
    license: "Proprietary",
    commercial_use: true,
  },
  {
    id: "MidiCraft",
    component: "MidiCraft",
    tier: "pro",
    provider: "internal",
    input_type: "text",
    output_type: "midi",
    license: "Proprietary",
    commercial_use: true,
  },
  {
    id: "VSTCraft",
    component: "VSTCraft",
    tier: "pro",
    provider: "internal",
    input_type: "text",
    output_type: "preset",
    license: "Proprietary",
    commercial_use: true,
  },
] satisfies ModelConfig[];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return modelRegistry.find((model) => model.id === modelId);
}

export function getModelsByComponent(component: SoundAIComponent): ModelConfig[] {
  return modelRegistry.filter((model) => model.component === component);
}

export function findFallbackLiteModel(
  component: SoundAIComponent,
  outputType?: ModelOutputType,
  inputType: ModelInputType = "text",
): ModelConfig | undefined {
  const candidates = modelRegistry.filter(
    (model) =>
      model.tier === "lite" &&
      model.component === component &&
      model.input_type === inputType &&
      (!outputType || model.output_type === outputType),
  );

  return candidates.find((model) => model.commercial_use) ?? candidates[0];
}

export function findDefaultModel(
  component: SoundAIComponent,
  tier: ModelTier,
  outputType?: ModelOutputType,
  inputType: ModelInputType = "text",
): ModelConfig | undefined {
  const candidates = modelRegistry.filter(
    (model) =>
      model.component === component &&
      model.tier === tier &&
      model.input_type === inputType &&
      (!outputType || model.output_type === outputType),
  );

  return candidates.find((model) => model.commercial_use) ?? candidates[0];
}
