import type { GenerationRequest, GenerationResult, ModelConfig } from "../types";
import { formatGenerationResult } from "../outputFormatter";
import { assertServerRuntime } from "../runtime";

type ProOptions = {
  endpointBaseUrl?: string;
  timeoutMs?: number;
};

export async function generateWithPro(
  modelConfig: ModelConfig,
  prompt: string,
  request: GenerationRequest,
  options: ProOptions = {},
): Promise<GenerationResult> {
  assertServerRuntime();

  if (modelConfig.provider !== "internal") {
    throw new Error(`Model ${modelConfig.id} is not an internal Pro model.`);
  }

  const baseUrl = options.endpointBaseUrl?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("PRO_ENDPOINT_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_id: modelConfig.id,
        component: modelConfig.component,
        prompt,
        output_type: modelConfig.output_type,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Internal Pro endpoint returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { data?: string; metadata?: Partial<GenerationResult["metadata"]> };
    if (!payload.data) throw new Error("PRO_ENDPOINT_EMPTY_RESPONSE");
    return formatGenerationResult(modelConfig, payload.data, request, payload.metadata);
  } finally {
    globalThis.clearTimeout(timeout);
  }
}
