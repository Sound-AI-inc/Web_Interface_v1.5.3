import type { IncomingMessage } from "node:http";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getModelConfig } from "../../src/app/lib/ai/modelRegistry";
import type { ModelConfig, UserPlan } from "../../src/app/lib/ai/types";
import { HttpError } from "./http";

export type AuthenticatedUser = {
  id: string;
  tier: UserPlan;
  email?: string;
};

function bearerToken(request: IncomingMessage): string {
  const header = request.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const match = value?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "AUTH_REQUIRED", "Missing bearer token");
  return match[1];
}

function normalizeTier(value: unknown): UserPlan {
  if (value === "premium" || value === "enterprise") return value;
  return "free";
}

function tierFromUser(user: User): UserPlan {
  const appMetadata = user.app_metadata as Record<string, unknown>;
  return normalizeTier(appMetadata.plan ?? appMetadata.tier ?? appMetadata.subscription_tier);
}

export async function resolveUserTier(
  supabase: SupabaseClient,
  request: IncomingMessage,
): Promise<AuthenticatedUser> {
  const token = bearerToken(request);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "INVALID_SESSION", "Invalid Supabase session");
  }

  return {
    id: data.user.id,
    tier: tierFromUser(data.user),
    email: data.user.email,
  };
}

export function enforceModelAccess(userTier: UserPlan, requestedModel: ModelConfig | string | undefined): ModelConfig | undefined {
  const model = typeof requestedModel === "string" ? getModelConfig(requestedModel) : requestedModel;
  if (!model) return undefined;

  if (userTier === "free" && model.tier !== "lite") {
    throw new HttpError(403, "MODEL_TIER_FORBIDDEN", "Free users can only access Lite models");
  }

  if (userTier === "premium" && model.provider !== "internal" && model.tier !== "lite") {
    throw new HttpError(403, "MODEL_PROVIDER_FORBIDDEN", "Premium users cannot access this model provider");
  }

  return model;
}
