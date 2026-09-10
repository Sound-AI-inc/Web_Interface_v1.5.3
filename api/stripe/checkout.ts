import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError, errorStatus, errorCode } from "../_lib/http";
import { resolveUserTier } from "../_lib/auth";

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

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

interface PriceMapping {
  priceId: string;
  planId: string;
  credits: number;
}

const PRICE_MAP: PriceMapping[] = [
  { priceId: process.env.STRIPE_PRICE_STANDARD_MONTHLY ?? "price_standard_monthly", planId: "standard_monthly", credits: 30 },
  { priceId: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "price_standard_annual", planId: "standard_annual", credits: 30 },
  { priceId: process.env.STRIPE_PRICE_PREMIUM_50 ?? "price_premium_50", planId: "premium_flex_50", credits: 50 },
  { priceId: process.env.STRIPE_PRICE_PREMIUM_100 ?? "price_premium_100", planId: "premium_flex_100", credits: 100 },
  { priceId: process.env.STRIPE_PRICE_PREMIUM_500 ?? "price_premium_500", planId: "premium_flex_500", credits: 500 },
  { priceId: process.env.STRIPE_PRICE_PREMIUM_1000 ?? "price_premium_1000", planId: "premium_flex_1000", credits: 1000 },
  { priceId: process.env.STRIPE_PRICE_PREMIUM_3000 ?? "price_premium_3000", planId: "premium_flex_3000", credits: 3000 },
];

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!STRIPE_SECRET_KEY) {
    json(response, 503, { error: "STRIPE_NOT_CONFIGURED" });
    return;
  }

  try {
    const supabase = getServerSupabase();
    const authUser = await resolveUserTier(supabase, request);

    // Read body.
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { priceId?: string; planId?: string; successUrl?: string; cancelUrl?: string };

    const priceId = body.priceId ?? body.planId;
    if (!priceId) {
      json(response, 400, { error: "INVALID_REQUEST", message: "priceId or planId is required" });
      return;
    }

    const mapping = PRICE_MAP.find((p) => p.priceId === priceId || p.planId === priceId);
    if (!mapping) {
      json(response, 400, { error: "INVALID_PLAN", message: "Unknown plan or price ID" });
      return;
    }

    // Create a Stripe Checkout Session.
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[][price_data][currency]": "usd",
        "line_items[][price_data][product_data][name]": `SoundAI ${mapping.planId}`,
        "line_items[][price_data][unit_amount]": String(mapping.credits * 100),
        "line_items[][quantity]": "1",
        "line_items[][price_data][recurring][interval]": mapping.planId.includes("annual") ? "year" : "month",
        "mode": mapping.planId.includes("annual") || mapping.planId.startsWith("premium") ? "subscription" : "payment",
        "success_url": body.successUrl ?? `${APP_URL}/app/billing?success=true`,
        "cancel_url": body.cancelUrl ?? `${APP_URL}/app/billing?canceled=true`,
        "client_reference_id": authUser.id,
        "metadata[plan_id]": mapping.planId,
        "metadata[user_id]": authUser.id,
      }),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      throw new HttpError(500, "STRIPE_ERROR", err);
    }

    const session = await stripeRes.json() as { id: string; url: string };
    json(response, 200, { sessionId: session.id, url: session.url });
  } catch (error) {
    json(response, errorStatus(error), { error: errorCode(error) });
  }
}