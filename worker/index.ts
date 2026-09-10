import type { IncomingMessage, ServerResponse } from "node:http";
import generateHandler from "../api/generate";
import creditsHandler from "../api/credits";
import stripeCheckoutHandler from "../api/stripe/checkout";
import stripePortalHandler from "../api/stripe/portal";
import stripeWebhookHandler from "../api/stripe/webhook";
import { runNodeHandler } from "../api/_lib/workerAdapter";

type Env = {
  ASSETS: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  HF_API_KEY?: string;
  HUGGINGFACE_INFERENCE_BASE_URL?: string;
  SOUNDAI_INTERNAL_INFERENCE_URL?: string;
  AI_INFERENCE_TIMEOUT_MS?: string;
  AI_INFERENCE_RETRIES?: string;
  GENERATION_CACHE_TTL_SECONDS?: string;
  ENTERPRISE_RATE_LIMIT_PER_MINUTE?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  CREDIT_TEST_ADMIN_ENABLED?: string;
  CREDIT_TEST_ADMIN_EMAIL?: string;
  CREDIT_TEST_ADMIN_BALANCE?: string;
  VITE_WEBSITE_URL?: string;
};

const apiRoutes: Record<string, (request: IncomingMessage, response: ServerResponse) => Promise<void>> = {
  "/api/generate": generateHandler,
  "/api/credits": creditsHandler,
  "/api/stripe/checkout": stripeCheckoutHandler,
  "/api/stripe/portal": stripePortalHandler,
  "/api/stripe/webhook": stripeWebhookHandler,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const routeHandler = apiRoutes[url.pathname];

    if (routeHandler) {
      try {
        return await runNodeHandler(routeHandler, request, env);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return Response.json({ error: "INTERNAL_ERROR", message }, { status: 500 });
      }
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({ error: "API_NOT_FOUND", path: url.pathname }, { status: 404 });
    }

    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status === 404) {
      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html")) {
        const indexRequest = new Request(`${url.origin}/index.html`, request);
        return env.ASSETS.fetch(indexRequest);
      }
    }

    return assetResponse;
  },
};
