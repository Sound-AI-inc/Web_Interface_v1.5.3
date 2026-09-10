import type { IncomingMessage } from "node:http";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getModelConfig } from "../../src/app/lib/ai/modelRegistry";
import type { ModelConfig, UserPlan } from "../../src/app/lib/ai/types";
import { HttpError } from "./http";

export type AuthenticatedUser = {
  id: string;
  tier: UserPlan;
  email?: string;
  planId?: string;
  subscriptionStatus?: string | null;
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

/**
 * Resolve the user's plan from the subscriptions table, falling back to
 * app_metadata. This is the single source of truth for entitlement checks.
 */
export async function resolveUserTier(
  supabase: SupabaseClient,
  request: IncomingMessage,
): Promise<AuthenticatedUser> {
  const token = bearerToken(request);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "INVALID_SESSION", "Invalid Supabase session");
  }

  const baseTier = tierFromUser(data.user);

  // Try to resolve from subscriptions table first.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, status")
    .eq("user_id", data.user.id)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let tier: UserPlan = baseTier;
  let planId: string | undefined;
  let subscriptionStatus: string | null = null;

  if (sub) {
    subscriptionStatus = sub.status;
    planId = sub.plan_id;
    if (planId === "free_trial" || planId === "standard_monthly" || planId === "standard_annual") {
      tier = "free";
    } else if (planId?.startsWith("premium_flex")) {
      tier = "premium";
    } else if (planId === "enterprise_custom") {
      tier = "enterprise";
    }
  }

  return {
    id: data.user.id,
    tier,
    email: data.user.email,
    planId,
    subscriptionStatus,
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
