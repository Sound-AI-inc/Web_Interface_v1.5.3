import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationRequest, GenerationResult, ModelConfig, UserPlan } from "../../src/app/lib/ai/types";

const CACHE_TTL_SECONDS = Number(process.env.GENERATION_CACHE_TTL_SECONDS ?? 3600);

export function generationCacheKey(model: ModelConfig, request: GenerationRequest): string {
  return createHash("sha256")
    .update(JSON.stringify({
      model_id: model.id,
      prompt: request.prompt,
      input_type: request.input_type,
      output_type: request.output_type,
      metadata: request.metadata ?? {},
    }))
    .digest("hex");
}

export function canCacheGeneration(model: ModelConfig, userTier: UserPlan, request: GenerationRequest): boolean {
  return model.tier === "lite" && model.commercial_use && userTier !== "enterprise" && request.input_type !== "audio";
}

export async function getCachedGeneration(
  supabase: SupabaseClient,
  cacheKey: string,
): Promise<GenerationResult | null> {
  const { data, error } = await supabase
    .from("generation_cache")
    .select("result")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data.result as GenerationResult;
}

export async function storeCachedGeneration(
  supabase: SupabaseClient,
  cacheKey: string,
  model: ModelConfig,
  result: GenerationResult,
): Promise<void> {
  await supabase.from("generation_cache").upsert({
    cache_key: cacheKey,
    model_id: model.id,
    result,
    expires_at: new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString(),
  });
}
