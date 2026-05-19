import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getModelConfig } from "../src/app/lib/ai/modelRegistry";
import { enqueueGenerationJob, processGenerationJob } from "../src/app/lib/ai/queue";
import { selectGenerationModel } from "../src/app/lib/ai/router";
import { assertServerRuntime } from "../src/app/lib/ai/runtime";
import type { GenerationRequest, SoundAIUser } from "../src/app/lib/ai/types";
import { resolveUserTier, enforceModelAccess } from "./_lib/auth";
import { generationCacheKey, canCacheGeneration, getCachedGeneration, storeCachedGeneration } from "./_lib/cache";
import { consumeCredits } from "./_lib/credits";
import { errorCode, errorStatus, HttpError } from "./_lib/http";
import { recordGenerationMetric } from "./_lib/observability";
import { applyRateLimit } from "./_lib/rateLimit";
import { readJson } from "./_lib/readJson";
import { validateGenerateRequest } from "./_lib/validation";

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

function getServerSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new HttpError(503, "SUPABASE_NOT_CONFIGURED", "Supabase server credentials are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hardenRequestMode(user: SoundAIUser, request: GenerationRequest): GenerationRequest {
  const requestedModel = request.model_id ? getModelConfig(request.model_id) : undefined;
  if (request.model_id && !requestedModel) {
    throw new HttpError(400, "UNKNOWN_MODEL", "Requested model is not registered");
  }
  enforceModelAccess(user.plan, requestedModel);

  return {
    ...request,
    mode: requestedModel?.tier ?? (user.plan === "free" ? "lite" : request.mode === "lite" ? "lite" : "pro"),
    commercial_intent: user.plan !== "free" && request.commercial_intent === true,
  };
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  assertServerRuntime();

  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  const startedAt = performance.now();
  let userId = "unknown";
  let modelId = "unknown";
  let tier: SoundAIUser["plan"] = "free";
  let supabase: SupabaseClient | null = null;

  try {
    supabase = getServerSupabase();
    const payload = validateGenerateRequest(await readJson<unknown>(request));
    const authUser = await resolveUserTier(supabase, request);
    userId = authUser.id;
    tier = authUser.tier;

    const user: SoundAIUser = { id: authUser.id, plan: authUser.tier };
    const securedRequest = hardenRequestMode(user, payload.request);
    const selected = selectGenerationModel(user, securedRequest);
    enforceModelAccess(user.plan, selected.model);
    modelId = selected.model.id;

    await applyRateLimit(request, authUser);

    const cacheable = canCacheGeneration(selected.model, user.plan, securedRequest);
    const cacheKey = cacheable ? generationCacheKey(selected.model, securedRequest) : null;
    if (cacheKey) {
      const cached = await getCachedGeneration(supabase, cacheKey);
      if (cached) {
        await recordGenerationMetric(supabase, {
          user_id: user.id,
          model_id: selected.model.id,
          tier: selected.model.tier,
          latency_ms: Math.round(performance.now() - startedAt),
          status: "cached",
        });
        json(response, 200, {
          result: cached,
          compliance: {
            allowed: true,
            usage_restriction: cached.metadata.output_label ?? "Commercial use allowed",
            output_label: cached.metadata.output_label ?? "Commercial use allowed",
          },
          model: selected.model,
          fallback_used: false,
          cached: true,
        });
        return;
      }
    }

    await consumeCredits(supabase, user.id, selected.model.output_type);

    const job = await enqueueGenerationJob(user, securedRequest);
    const routed = await processGenerationJob(job, {
      hfApiKey: process.env.HF_API_KEY,
      hfEndpointBaseUrl: process.env.HUGGINGFACE_INFERENCE_BASE_URL,
      proEndpointBaseUrl: process.env.SOUNDAI_INTERNAL_INFERENCE_URL,
      timeoutMs: Number(process.env.AI_INFERENCE_TIMEOUT_MS ?? 60000),
      retries: Number(process.env.AI_INFERENCE_RETRIES ?? 2),
    });

    if (cacheKey && canCacheGeneration(routed.model, user.plan, securedRequest)) {
      await storeCachedGeneration(supabase, cacheKey, routed.model, routed.result);
    }

    await recordGenerationMetric(supabase, {
      user_id: user.id,
      model_id: routed.model.id,
      tier: routed.model.tier,
      latency_ms: Math.round(performance.now() - startedAt),
      status: "success",
    });

    json(response, 200, routed);
  } catch (error) {
    await recordGenerationMetric(supabase, {
      user_id: userId,
      model_id: modelId,
      tier: tier === "free" ? "lite" : "pro",
      latency_ms: Math.round(performance.now() - startedAt),
      status:
        errorCode(error) === "RATE_LIMITED"
          ? "rate_limited"
          : errorCode(error) === "INSUFFICIENT_CREDITS"
            ? "insufficient_credits"
            : errorStatus(error) === 401 || errorStatus(error) === 403
              ? "unauthorized"
              : "error",
      error_code: errorCode(error),
    });

    json(response, errorStatus(error), {
      error: errorCode(error),
    });
  }
}
