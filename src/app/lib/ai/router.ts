import { validateModelUsage, assertCommercialUseAllowed, decorateComplianceMetadata } from "./compliance";
import { getDatasetConfig } from "./datasetRegistry";
import { findDefaultModel, findFallbackLiteModel, getModelConfig } from "./modelRegistry";
import { generateWithGithubMidi } from "./providers/githubMidi";
import { generateWithHF } from "./providers/huggingFace";
import { generateWithPro } from "./providers/pro";
import type {
  GenerationLogEvent,
  GenerationRequest,
  GenerationResult,
  ModelConfig,
  ModelTier,
  RouteGenerationOptions,
  RoutedGenerationResponse,
  SoundAIUser,
} from "./types";

export function allowedTiersForPlan(plan: SoundAIUser["plan"]): ModelTier[] {
  if (plan === "free") return ["lite"];
  return ["lite", "pro"];
}

export function canUseModel(user: SoundAIUser, model: ModelConfig): boolean {
  return allowedTiersForPlan(user.plan).includes(model.tier);
}

export function selectGenerationModel(user: SoundAIUser, request: GenerationRequest): { model: ModelConfig; fallbackUsed: boolean } {
  const inputType = request.input_type ?? "text";
  const requestedTier = request.mode ?? (user.plan === "free" ? "lite" : "pro");
  const requestedModel = request.model_id ? getModelConfig(request.model_id) : undefined;

  if (requestedModel && canUseModel(user, requestedModel)) {
    return { model: requestedModel, fallbackUsed: false };
  }

  const defaultModel = findDefaultModel(request.component, requestedTier, request.output_type, inputType);
  if (defaultModel && canUseModel(user, defaultModel)) {
    return { model: defaultModel, fallbackUsed: false };
  }

  const liteFallback = findFallbackLiteModel(request.component, request.output_type, inputType);
  if (liteFallback) return { model: liteFallback, fallbackUsed: true };

  throw new Error(`No supported model route for ${request.component}.`);
}

async function invokeModel(
  model: ModelConfig,
  request: GenerationRequest,
  options: RouteGenerationOptions,
): Promise<GenerationResult> {
  if (model.provider === "huggingface") {
    return generateWithHF(model, request.prompt, request, {
      apiKey: options.hfApiKey,
      endpointBaseUrl: options.hfEndpointBaseUrl,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
    });
  }

  if (model.provider === "internal") {
    return generateWithPro(model, request.prompt, request, {
      endpointBaseUrl: options.proEndpointBaseUrl,
      timeoutMs: options.timeoutMs,
    });
  }

  return generateWithGithubMidi(model, request);
}

async function writeLog(options: RouteGenerationOptions, event: GenerationLogEvent): Promise<void> {
  try {
    await options.logEvent?.(event);
  } catch {
    // Observability should not fail the generation path.
  }
}

export async function routeGenerationRequest(
  user: SoundAIUser,
  request: GenerationRequest,
  options: RouteGenerationOptions = {},
): Promise<RoutedGenerationResponse> {
  const startedAt = performance.now();
  const dataset = request.dataset ? getDatasetConfig(request.dataset) : undefined;
  const selection = selectGenerationModel(user, request);
  let model = selection.model;
  let fallbackUsed = selection.fallbackUsed;

  if (request.commercial_intent) {
    assertCommercialUseAllowed(model, true);
  }

  let compliance = validateModelUsage(model, user.plan, dataset);
  if (!compliance.allowed) {
    throw new Error(compliance.usage_restriction);
  }

  try {
    const result = decorateComplianceMetadata(await invokeModel(model, request, options), model);
    await writeLog(options, {
      user_id: user.id,
      model_id: model.id,
      tier: model.tier,
      latency_ms: Math.round(performance.now() - startedAt),
      status: "success",
    });

    return { result, compliance, model, dataset, fallback_used: fallbackUsed };
  } catch (error) {
    const canFallback = model.tier === "pro";
    const fallback = canFallback
      ? findFallbackLiteModel(model.component, request.output_type ?? model.output_type, request.input_type ?? model.input_type)
      : undefined;

    if (!fallback) {
      await writeLog(options, {
        user_id: user.id,
        model_id: model.id,
        tier: model.tier,
        latency_ms: Math.round(performance.now() - startedAt),
        status: "error",
        error_code: error instanceof Error ? error.message : "UNKNOWN_GENERATION_ERROR",
      });
      throw error;
    }

    model = fallback;
    fallbackUsed = true;
    compliance = validateModelUsage(model, user.plan, dataset);
    if (!compliance.allowed) throw new Error(compliance.usage_restriction);

    const result = decorateComplianceMetadata(await invokeModel(model, request, options), model);
    await writeLog(options, {
      user_id: user.id,
      model_id: model.id,
      tier: model.tier,
      latency_ms: Math.round(performance.now() - startedAt),
      status: "success",
    });

    return { result, compliance, model, dataset, fallback_used: fallbackUsed };
  }
}

export * from "./types";
export * from "./modelRegistry";
export * from "./datasetRegistry";
export * from "./compliance";
