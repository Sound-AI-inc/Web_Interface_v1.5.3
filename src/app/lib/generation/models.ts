import type { BrandSelectOption } from "../../components/BrandSelect";
import type { GenerationType } from "../promptGeneration";
import { toModelSelectOptions } from "../modelOptions";

/**
 * P4-A — Extensible model catalog. The Generator UI reads model lists and
 * availability from here instead of hardcoding provider assumptions.
 * Availability is configuration-driven: a model that is not configured
 * (missing env / endpoint) is reported unavailable, never selectable
 * as if it were live.
 */

export interface CatalogModel {
  id: string;
  label: string;
  mode: "lite" | "pro";
  component: "SoundCraft" | "MidiCraft" | "VSTCraft" | "MusCraft" | "HuggingFace";
  /** False when the backing endpoint/configuration is missing. */
  available: boolean;
  unavailableReason?: string;
}

const LITE_AUDIO_MODELS = [
  "facebook/musicgen-small",
  "facebook/audiogen-medium",
  "stabilityai/stable-audio-open-small",
  "chinedudave06/musicgen-small-onnx",
];

function env(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return value?.trim() || undefined;
}

/** Lite availability: Hugging Face base URL configured (server-owned key). */
function liteAvailable(): { available: boolean; reason?: string } {
  if (env("VITE_AI_GENERATION_API_URL") || env("VITE_SOUNDCRAFT_API_URL")) {
    return { available: true };
  }
  return { available: false, reason: "Inference endpoint not connected" };
}

function proAvailable(component: "SoundCraft" | "MidiCraft" | "VSTCraft" | "MusCraft"): {
  available: boolean;
  reason?: string;
} {
  const key =
    component === "SoundCraft"
      ? "VITE_SOUNDCRAFT_API_URL"
      : component === "MidiCraft"
        ? "VITE_MIDICRAFT_API_URL"
        : component === "VSTCraft"
          ? "VITE_VSTCRAFT_API_URL"
          : "VITE_MUSCRAFT_API_URL";
  // The orchestration endpoint can also serve pro requests.
  if (env(key) || env("VITE_AI_GENERATION_API_URL")) return { available: true };
  return { available: false, reason: "Provider endpoint not connected" };
}

export function modelsForType(type: GenerationType, mode: "lite" | "pro"): CatalogModel[] {
  if (mode === "lite") {
    if (type !== "Audio Sample") return [];
    const { available, reason } = liteAvailable();
    return LITE_AUDIO_MODELS.map((id) => ({
      id,
      label: id,
      mode,
      component: "HuggingFace",
      available,
      unavailableReason: reason,
    }));
  }
  const component = type === "Audio Sample" ? "SoundCraft" : type === "MIDI Melody" ? "MidiCraft" : "VSTCraft";
  const { available, reason } = proAvailable(component);
  return [{ id: component, label: component, mode, component, available, unavailableReason: reason }];
}

export function modelSelectOptions(
  type: GenerationType,
  mode: "lite" | "pro",
): { options: BrandSelectOption[]; availability: Record<string, CatalogModel> } {
  const catalog = modelsForType(type, mode);
  const availability: Record<string, CatalogModel> = {};
  for (const model of catalog) availability[model.id] = model;
  return { options: toModelSelectOptions(catalog.map((m) => m.id), mode), availability };
}
