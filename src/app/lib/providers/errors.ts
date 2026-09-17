import type { ProviderErrorCategory, ProviderErrorDescriptor } from "../../types/generation";
import { DEFAULT_PROVIDER_POLICY, type ProviderPolicy } from "./types";

/**
 * P4-B — Normalized provider errors. Every adapter maps raw failures into
 * this shape so the UI can decide honestly: what to show, whether Retry is
 * safe, and what never to retry.
 */

const RETRYABLE: Record<ProviderErrorCategory, boolean> = {
  configuration: false,
  authentication: false,
  rate_limit: true,
  timeout: true,
  validation: false,
  provider_unavailable: true,
  generation_failed: true,
  invalid_response: false,
  insufficient_credits: false,
  unknown: false,
};

export function isRetryableCategory(category: ProviderErrorCategory): boolean {
  return RETRYABLE[category];
}

function categorize(message: string): ProviderErrorCategory {
  const text = message.toLowerCase();
  if (/insufficient|not enough credits|402|quota exceeded/.test(text)) return "insufficient_credits";
  if (/unauthorized|401|403|forbidden|invalid key|auth_required/.test(text)) return "authentication";
  if (/rate.?limit|429|too many/.test(text)) return "rate_limit";
  if (/timeout|timed out|504|abort/.test(text)) return "timeout";
  if (/validation|invalid prompt|400|bad request|unknown_model/.test(text)) return "validation";
  if (/econnrefused|enotfound|fetch failed|network|503|502|unavailable|not connected/.test(text)) {
    return "provider_unavailable";
  }
  if (/invalid response|unexpected token|malformed|empty candidates/.test(text)) return "invalid_response";
  if (/misconfigured|missing.*(url|key|endpoint)|not configured/.test(text)) return "configuration";
  if (/generation failed|failed/.test(text)) return "generation_failed";
  return "unknown";
}

/** User-safe: strips URLs, tokens, and infrastructure internals. */
function sanitize(message: string): string {
  return message
    .replace(/https?:\/\/[^\s"']+/gi, "<endpoint>")
    .replace(/bearer\s+[^\s"']+/gi, "Bearer <redacted>")
    .replace(/key[=:]\s*[^\s"']+/gi, "key=<redacted>")
    .slice(0, 280);
}

export function normalizeProviderError(provider: string, raw: unknown): ProviderErrorDescriptor {
  const message = raw instanceof Error ? raw.message : String(raw ?? "Unknown provider error");
  const category = categorize(message);
  return {
    code: `${provider.toUpperCase()}_${category.toUpperCase()}`,
    provider,
    category,
    retryable: RETRYABLE[category],
    message: sanitize(message) || "The generation service is currently unavailable.",
  };
}

export function policyFor(retryable: ProviderErrorCategory[]): ProviderPolicy {
  return { ...DEFAULT_PROVIDER_POLICY, retryableCategories: retryable };
}
