import type { IncomingMessage, ServerResponse } from "node:http";
import { getProviderConfig } from "./_lib/providerConfig";
import type { ProviderHealth } from "../../src/app/types/generation";

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

async function checkProviderHealth(provider: string, config: {
  endpointConfigured: boolean;
  authenticationConfigured: boolean;
  capabilities: {
    provider: string;
    assetTypes: string[];
    formats: string[];
    modes: string[];
    models: string[];
    status: string;
    statusReason?: string;
  };
}, env: Record<string, unknown>): Promise<ProviderHealth> {
  const startedAt = Date.now();

  if (!config.endpointConfigured || !config.authenticationConfigured) {
    return {
      provider,
      configured: config.endpointConfigured,
      authenticated: config.authenticationConfigured,
      reachable: false,
      healthy: false,
      latencyMs: Date.now() - startedAt,
      error: config.capabilities.statusReason,
    };
  }

  let reachable = false;
  let healthy = false;
  let error: string | undefined;

  try {
    if (provider === "SoundCraft" || provider === "MidiCraft" || provider === "VSTCraft") {
      const baseUrl = (env.SOUNDAI_INTERNAL_INFERENCE_URL as string)?.replace(/\/$/, "");
      if (baseUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${baseUrl}/health`, {
            method: "GET",
            signal: controller.signal,
          });
          reachable = true;
          if (response.ok) {
            healthy = true;
          } else {
            error = `Health endpoint returned HTTP ${response.status}`;
          }
        } catch (e) {
          error = e instanceof Error ? e.message : "Health check failed";
        } finally {
          clearTimeout(timeout);
        }
      }
    } else if (provider === "HuggingFaceLite") {
      const hfApiKey = env.HF_API_KEY as string | undefined;
      const hfInferenceBaseUrl = (env.HUGGINGFACE_INFERENCE_BASE_URL as string | undefined)?.replace(/\/$/, "");
      const baseUrl = hfInferenceBaseUrl || "https://api-inference.huggingface.co";
      if (baseUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${baseUrl}/models/facebook/musicgen-small`, {
            method: "HEAD",
            headers: {
              ...(hfApiKey ? { Authorization: `Bearer ${hfApiKey}` } : {}),
            },
            signal: controller.signal,
          });
          reachable = true;
          if (response.ok || response.status === 404) {
            healthy = true;
          } else if (response.status === 401 || response.status === 403) {
            error = "Authentication failed";
            healthy = false;
          } else {
            error = `Model endpoint returned HTTP ${response.status}`;
          }
        } catch (e) {
          error = e instanceof Error ? e.message : "Health check failed";
        } finally {
          clearTimeout(timeout);
        }
      }
    } else if (provider === "RunPod") {
      const runpodApiKey = env.RUNPOD_API_KEY as string | undefined;
      const runpodApiUrl = (env.RUNPOD_API_URL as string | undefined)?.replace(/\/$/, "");
      if (runpodApiUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${runpodApiUrl}/health`, {
            method: "GET",
            headers: {
              ...(runpodApiKey ? { Authorization: `Bearer ${runpodApiKey}` } : {}),
            },
            signal: controller.signal,
          });
          reachable = true;
          if (response.ok) {
            healthy = true;
          } else {
            error = `Health endpoint returned HTTP ${response.status}`;
          }
        } catch (e) {
          error = e instanceof Error ? e.message : "Health check failed";
        } finally {
          clearTimeout(timeout);
        }
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Health check failed";
  }

  return {
    provider,
    configured: config.endpointConfigured,
    authenticated: config.authenticationConfigured,
    reachable,
    healthy,
    latencyMs: Date.now() - startedAt,
    error,
  };
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  
  if (url.pathname !== "/api/health" || request.method !== "GET") {
    json(response, 404, { error: "Not found" });
    return;
  }

  const env = process.env as Record<string, unknown>;
  const providers = getProviderConfig(env);
  const results: ProviderHealth[] = [];

  for (const [name, config] of Object.entries(providers)) {
    if (config.capabilities.models.length === 0 && config.status === "misconfigured") {
      results.push({
        provider: name,
        configured: false,
        authenticated: false,
        reachable: false,
        healthy: false,
        latencyMs: 0,
        error: config.capabilities.statusReason,
      });
      continue;
    }
    const health = await checkProviderHealth(name, config, env);
    results.push(health);
  }

  const overallHealthy = results.filter(r => r.configured).every(r => r.healthy);

  json(response, overallHealthy ? 200 : 503, {
    healthy: overallHealthy,
    providers: results,
    timestamp: new Date().toISOString(),
  });
}