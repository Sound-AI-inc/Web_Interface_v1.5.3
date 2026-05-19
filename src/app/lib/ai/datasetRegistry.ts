import type { DatasetConfig } from "./types";

const soundCraftModels = [
  "facebook/musicgen-small",
  "facebook/audiogen-medium",
  "stabilityai/stable-audio-open-small",
  "chinedudave06/musicgen-small-onnx",
  "SoundCraft",
];

const midiCraftModels = ["PopMusicTransformer", "Magenta Music Transformer", "GrooVAE", "MidiCraft"];

export const datasetRegistry = [
  {
    name: "FSD50K",
    source: "https://zenodo.org/records/4060432",
    type: "audio",
    license: "Creative Commons licenses; verify per-clip metadata before use",
    applicable_models: soundCraftModels,
    usage: "training",
  },
  {
    name: "AudioCaps",
    source: "https://audiocaps.github.io/",
    type: "multimodal",
    license: "Research",
    applicable_models: soundCraftModels,
    usage: "conditioning",
  },
  {
    name: "NSynth",
    source: "https://magenta.tensorflow.org/datasets/nsynth",
    type: "audio",
    license: "Creative Commons Attribution 4.0 International",
    applicable_models: soundCraftModels,
    usage: "training",
  },
  {
    name: "Clotho",
    source: "https://zenodo.org/communities/clotho",
    type: "multimodal",
    license: "Research",
    applicable_models: soundCraftModels,
    usage: "conditioning",
  },
  {
    name: "Slakh2100",
    source: "http://www.slakh.com/",
    type: "multimodal",
    license: "Creative Commons Attribution 4.0 International",
    applicable_models: [...soundCraftModels, ...midiCraftModels],
    usage: "training",
  },
  {
    name: "Aria-MIDI",
    source: "https://github.com/EleutherAI/aria-midi",
    type: "midi",
    license: "Research",
    applicable_models: midiCraftModels,
    usage: "training",
  },
  {
    name: "MidiCaps",
    source: "https://github.com/AMAAI-Lab/MidiCaps",
    type: "multimodal",
    license: "Research",
    applicable_models: midiCraftModels,
    usage: "conditioning",
  },
  {
    name: "Groove MIDI",
    source: "https://magenta.tensorflow.org/datasets/groove",
    type: "midi",
    license: "Creative Commons Attribution 4.0 International",
    applicable_models: ["GrooVAE", "MidiCraft"],
    usage: "training",
  },
  {
    name: "Lakh MIDI",
    source: "https://colinraffel.com/projects/lmd/",
    type: "midi",
    license: "Research",
    applicable_models: midiCraftModels,
    usage: "training",
  },
  {
    name: "FMA",
    source: "https://github.com/mdeff/fma",
    type: "audio",
    license: "Creative Commons licenses; verify per-track metadata before use",
    applicable_models: soundCraftModels,
    usage: "training",
  },
  {
    name: "MedleyDB",
    source: "https://medleydb.weebly.com/",
    type: "multimodal",
    license: "Research",
    applicable_models: [...soundCraftModels, ...midiCraftModels],
    usage: "training",
  },
] satisfies DatasetConfig[];

export function getDatasetConfig(name: string): DatasetConfig | undefined {
  return datasetRegistry.find((dataset) => dataset.name.toLowerCase() === name.toLowerCase());
}
