import type { BrandSelectOption } from "../components/BrandSelect";

const LITE_MODEL_LABELS: Record<string, string> = {
  "facebook/musicgen-small": "MusicGen Small v1.5",
  "facebook/audiogen-medium": "AudioGen Medium v1.0",
  "stabilityai/stable-audio-open-small": "Stable Audio Open Small v1.0",
  "chinedudave06/musicgen-small-onnx": "MusicGen Small ONNX v1.5",
};

const PRO_MODEL_LABELS: Record<string, string> = {
  SoundCraft: "SoundCraft 1.1",
  MidiCraft: "MidiCraft 1.1",
  VSTCraft: "VSTCraft 1.1",
};

export function toModelSelectOptions(
  values: string[],
  mode: "lite" | "pro",
): BrandSelectOption[] {
  const labels = mode === "lite" ? LITE_MODEL_LABELS : PRO_MODEL_LABELS;
  return values.map((value) => ({
    value,
    label: labels[value] ?? value,
  }));
}
