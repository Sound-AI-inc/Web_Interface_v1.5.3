import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError, errorStatus, errorCode } from "../_lib/http";

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
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

async function verifySignature(payload: string, sigHeader: string): Promise<WebhookEvent> {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(500, "WEBHOOK_NOT_CONFIGURED", "STRIPE_WEBHOOK_SECRET is not set");
  }

  // Verify HMAC-SHA256 signature.
  const crypto = await import("node:crypto");
  const sigParts = sigHeader.split(",");
  let timestamp: string | null = null;
  let signature: string | null = null;
  for (const part of sigParts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") signature = value;
  }

  if (!timestamp || !signature) {
    throw new HttpError(400, "INVALID_SIGNATURE", "Malformed signature header");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("hex");

  if (expectedSig !== signature) {
    throw new HttpError(400, "SIGNATURE_MISMATCH", "Webhook signature verification failed");
  }

  return JSON.parse(payload) as WebhookEvent;
}

async function upsertSubscription(
  supabase: SupabaseClient,
  event: WebhookEvent,
): Promise<void> {
  const obj = event.data.object;
  const customerId = (obj.customer as string) ?? null;
  const subId = (obj.id as string) ?? null;
  const status = (obj.status as string) ?? "incomplete";
  const planId = ((obj.metadata as Record<string, unknown> | undefined)?.plan_id as string) ?? "free_trial";
  const trialEnd = (obj.trial_end as number | undefined)
    ? new Date(obj.trial_end * 1000).toISOString()
    : null;
  const currentPeriodStart = (obj.current_period_start as number | undefined)
    ? new Date(obj.current_period_start * 1000).toISOString()
    : null;
  const currentPeriodEnd = (obj.current_period_end as number | undefined)
    ? new Date(obj.current_period_end * 1000).toISOString()
    : null;

  // Resolve user_id from metadata or customer.
  let userId = ((obj.metadata as Record<string, unknown> | undefined)?.user_id as string) ?? null;

  if (!userId) {
    // Try to resolve from Stripe customer.
    if (customerId && STRIPE_SECRET_KEY) {
      const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      if (custRes.ok) {
        const cust = await custRes.json() as { metadata?: Record<string, unknown> };
        userId = (cust.metadata?.user_id as string) ?? null;
      }
    }
  }

  if (!userId) {
    throw new HttpError(400, "USER_NOT_FOUND", "Could not resolve user from webhook event");
  }

  await supabase.from("subscriptions").upsert({
    id: subId,
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subId,
    status,
    plan_id: planId,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    trial_end: trialEnd,
    canceled_at: status === "canceled" ? new Date().toISOString() : null,
    cancel_at_period_end: (obj.cancel_at_period_end as boolean) ?? false,
    metadata: obj.metadata as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });

  // Grant subscription credits on active/trialing status.
  // Idempotent: the Stripe event ID is the stable grant reference, so a
  // duplicate webhook delivery credits the user exactly once.
  if (status === "active" || status === "trialing") {
    const { data: allowance } = await supabase
      .from("plan_allowances")
      .select("monthly_allowance")
      .eq("plan_id", planId)
      .maybeSingle();
    const credits = allowance?.monthly_allowance ?? 0;
    if (credits > 0) {
      await supabase.rpc("grant_credits", {
        p_user_id: userId,
        p_amount: credits,
        p_type: status === "trialing" ? "trial_grant" : "subscription_grant",
        p_reason: `stripe:${event.type}`,
        p_plan: planId,
        p_monthly_allowance: credits,
        p_grant_reference: `stripe:${event.id}`,
      });
    }
  }
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const payload = Buffer.concat(chunks).toString("utf8");
    const sigHeader = request.headers["stripe-signature"] as string;

    if (!sigHeader) {
      throw new HttpError(400, "MISSING_SIGNATURE", "stripe-signature header is required");
    }

    const event = await verifySignature(payload, sigHeader);
    const supabase = getServerSupabase();

    // Stripe-event idempotency: duplicate deliveries of the same event are
    // acknowledged without reprocessing (no duplicate subscription credits).
    const { data: existingEvent } = await supabase
      .from("idempotency_keys")
      .select("status")
      .eq("key", `stripe:${event.id}`)
      .maybeSingle();

    if (existingEvent?.status === "completed") {
      json(response, 200, { received: true, deduplicated: true });
      return;
    }

    if (!existingEvent) {
      await supabase.from("idempotency_keys").insert({
        key: `stripe:${event.id}`,
        user_id: "stripe-webhook",
        action: `stripe:${event.type}`,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(supabase, event);
        break;
      case "customer.subscription.deleted":
        await upsertSubscription(supabase, event);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        // Update subscription status from invoice.
        break;
      default:
        // Unknown event — ack.
        break;
    }

    await supabase.from("idempotency_keys").upsert({
      key: `stripe:${event.id}`,
      user_id: "stripe-webhook",
      action: `stripe:${event.type}`,
      status: "completed",
      result: { type: event.type },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "key" });

    json(response, 200, { received: true });
  } catch (error) {
    json(response, errorStatus(error), { error: errorCode(error) });
  }
}