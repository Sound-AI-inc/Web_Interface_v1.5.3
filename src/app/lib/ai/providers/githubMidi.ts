import type { GenerationRequest, GenerationResult, ModelConfig } from "../types";
import { assertServerRuntime } from "../runtime";

export async function generateWithGithubMidi(
  modelConfig: ModelConfig,
  _request: GenerationRequest,
): Promise<GenerationResult> {
  assertServerRuntime();
  void _request;

  if (modelConfig.provider !== "github") {
    throw new Error(`Model ${modelConfig.id} is not a GitHub-hosted MIDI model.`);
  }

  throw new Error("GITHUB_MIDI_INFERENCE_ENDPOINT_NOT_CONFIGURED");
}
