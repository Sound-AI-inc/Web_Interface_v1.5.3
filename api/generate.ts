import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getModelConfig } from "../src/app/lib/ai/modelRegistry";
import { enqueueGenerationJob, processGenerationJob } from "../src/app/lib/ai/queue";
import { selectGenerationModel } from "../src/app/lib/ai/router";
import { assertServerRuntime } from "../src/app/lib/ai/runtime";
import type { GenerationRequest, SoundAIUser } from "../src/app/lib/ai/types";
import { resolveUserTier, enforceModelAccess } from "./_lib/auth";
import { isAdminUser, getAdminBalance } from "./_lib/admin";
import { generationCacheKey, canCacheGeneration, getCachedGeneration, storeCachedGeneration } from "./_lib/cache";
import { consumeCredits, reserveCredits, restoreCredits } from "./_lib/credits";
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
  let generationId: string | null = null;
  let reservedAmount = 0;
  let storedIdempotencyKey: string | null = null;

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

    // Resolve count from payload (default 1).
    const count = Math.max(1, Number((payload as { count?: unknown }).count) || 1);

    // Idempotency: if a client-supplied key is provided, check for a prior result.
    const idempotencyKey = (payload as { idempotency_key?: unknown }).idempotency_key;
    if (typeof idempotencyKey === "string" && idempotencyKey.trim()) {
      const { data: existing } = await supabase
        .from("idempotency_keys")
        .select("status, result")
        .eq("key", idempotencyKey.trim())
        .maybeSingle();
      if (existing?.status === "completed" && existing.result) {
        json(response, 200, existing.result);
        return;
      }
      if (existing?.status === "pending") {
        json(response, 409, { error: "IDEMPOTENCY_REPLAY", message: "Request already in progress" });
        return;
      }
    }

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

    const normalizedIdempotencyKey =
      typeof idempotencyKey === "string" && idempotencyKey.trim() ? idempotencyKey.trim() : null;
    storedIdempotencyKey = normalizedIdempotencyKey;
    if (normalizedIdempotencyKey) {
      // Atomic claim: plain insert wins the race. A concurrent duplicate
      // gets a 23505 conflict and is treated as a replay (no double charge).
      const { error: idempotencyClaimError } = await supabase.from("idempotency_keys").insert({
        key: normalizedIdempotencyKey,
        user_id: userId,
        action: "generate",
        status: "pending",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (idempotencyClaimError) {
        const conflictCode = (idempotencyClaimError as { code?: string }).code;
        if (conflictCode === "23505") {
          const { data: replay } = await supabase
            .from("idempotency_keys")
            .select("status, result")
            .eq("key", normalizedIdempotencyKey)
            .maybeSingle();
          if (replay?.status === "completed" && replay.result) {
            json(response, 200, replay.result);
            return;
          }
          json(response, 409, { error: "IDEMPOTENCY_REPLAY", message: "Request already in progress" });
          return;
        }
        throw new HttpError(500, "IDEMPOTENCY_STORE_FAILED", idempotencyClaimError.message);
      }
    }

    // Generate a generation_id for the reservation/ledger linkage.
    generationId = crypto.randomUUID();

    // Admin preview/test override: skip credit reservation.
    const isAdmin = isAdminUser(authUser.email);
    const adminBalance = getAdminBalance();
    let creditResult: { cost: number; remaining: number; balance: number; reserved: number } | null = null;

    if (!isAdmin || adminBalance <= 0) {
      // Reserve credits BEFORE generation (atomic check).
      creditResult = await reserveCredits(supabase, user.id, selected.model.output_type, count, generationId);
      reservedAmount = creditResult.cost;
    } else {
      creditResult = { cost: 0, remaining: adminBalance, balance: adminBalance, reserved: 0 };
    }

    // Execute generation.
    const job = await enqueueGenerationJob(user, securedRequest);
    const routed = await processGenerationJob(job, {
      hfApiKey: process.env.HF_API_KEY,
      hfEndpointBaseUrl: process.env.HUGGINGFACE_INFERENCE_BASE_URL,
      proEndpointBaseUrl: process.env.SOUNDAI_INTERNAL_INFERENCE_URL,
      timeoutMs: Number(process.env.AI_INFERENCE_TIMEOUT_MS ?? 60000),
      retries: Number(process.env.AI_INFERENCE_RETRIES ?? 2),
    });

    // Consume reserved credits on success.
    if (!isAdmin || adminBalance <= 0) {
      creditResult = await consumeCredits(supabase, user.id, generationId);
    }

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

    const result = {
      ...routed,
      credits: {
        consumed: creditResult.cost,
        remaining: creditResult.remaining,
        balance: creditResult.balance,
        reserved: creditResult.reserved,
      },
    };

    // Persist idempotency result.
    if (normalizedIdempotencyKey) {
      await supabase.from("idempotency_keys").upsert({
        key: normalizedIdempotencyKey,
        user_id: userId,
        action: "generate",
        status: "completed",
        result,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "key" });
    }

    json(response, 200, result);
  } catch (error) {
    // Server-side diagnostic (wrangler tail). Response stays generic.
    try {
      console.error("generate failed", errorCode(error), error instanceof Error ? error.message : String(error));
    } catch {
      // Logging must never break error handling.
    }
    // Restore reserved credits on failure.
    if (supabase && generationId && reservedAmount > 0) {
      try {
        await restoreCredits(supabase, userId, generationId, "Generation failed; credits restored");
      } catch {
        // Restore failure is non-fatal for the error response.
      }
    }

    if (supabase && storedIdempotencyKey) {
      try {
        await supabase.from("idempotency_keys").upsert({
          key: storedIdempotencyKey,
          user_id: userId,
          action: "generate",
          status: "failed",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "key" });
      } catch {
        // Idempotency cleanup is non-fatal.
      }
    }

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
