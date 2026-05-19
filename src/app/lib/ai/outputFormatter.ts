import type { GenerationRequest, GenerationResult, ModelConfig } from "./types";

export function formatGenerationResult(
  modelConfig: ModelConfig,
  data: string,
  request: GenerationRequest,
  overrides: Partial<GenerationResult["metadata"]> = {},
): GenerationResult {
  return {
    type: modelConfig.output_type,
    data,
    metadata: {
      bpm: request.metadata?.bpm,
      key: request.metadata?.key,
      duration: request.metadata?.duration,
      ...overrides,
      model_used: modelConfig.id,
      component: modelConfig.component,
      license: modelConfig.license,
      commercial_use: modelConfig.commercial_use,
    },
  };
}
