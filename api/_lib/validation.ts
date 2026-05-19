import type { GenerationRequest, ModelInputType, ModelOutputType, SoundAIComponent } from "../../src/app/lib/ai/types";
import { HttpError } from "./http";

export type GenerateApiRequest = {
  request: GenerationRequest;
};

const components = new Set<SoundAIComponent>(["SoundCraft", "MidiCraft", "VSTCraft", "Infrastructure"]);
const inputTypes = new Set<ModelInputType>(["text", "midi", "audio"]);
const outputTypes = new Set<ModelOutputType>(["audio", "midi", "preset"]);

function cleanString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function validateGenerateRequest(payload: unknown): GenerateApiRequest {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "INVALID_JSON", "JSON object body is required");
  }

  const request = (payload as { request?: unknown }).request;
  if (!request || typeof request !== "object") {
    throw new HttpError(400, "INVALID_REQUEST", "request object is required");
  }

  const raw = request as Record<string, unknown>;
  const prompt = cleanString(raw.prompt, 2_000);
  const component = raw.component;
  if (!prompt) throw new HttpError(400, "INVALID_PROMPT", "prompt is required and must be <= 2000 characters");
  if (!components.has(component as SoundAIComponent)) throw new HttpError(400, "INVALID_COMPONENT", "Unsupported component");

  const inputType = raw.input_type === undefined ? undefined : raw.input_type;
  const outputType = raw.output_type === undefined ? undefined : raw.output_type;
  if (inputType !== undefined && !inputTypes.has(inputType as ModelInputType)) {
    throw new HttpError(400, "INVALID_INPUT_TYPE", "Unsupported input_type");
  }
  if (outputType !== undefined && !outputTypes.has(outputType as ModelOutputType)) {
    throw new HttpError(400, "INVALID_OUTPUT_TYPE", "Unsupported output_type");
  }

  return {
    request: {
      prompt,
      component: component as SoundAIComponent,
      model_id: cleanString(raw.model_id, 160),
      input_type: inputType as ModelInputType | undefined,
      output_type: outputType as ModelOutputType | undefined,
      dataset: cleanString(raw.dataset, 160),
      commercial_intent: raw.commercial_intent === true,
      metadata: typeof raw.metadata === "object" && raw.metadata !== null ? (raw.metadata as GenerationRequest["metadata"]) : undefined,
    },
  };
}
