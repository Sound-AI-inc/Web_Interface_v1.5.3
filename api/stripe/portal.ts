import type { IncomingMessage, ServerResponse } from "node:http";
import { HttpError, errorStatus, errorCode } from "../_lib/http";

function json(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.APP_URL ?? "http://localhost:5173";

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
    // Read body for return_url override.
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { customerId?: string; RETURN_URL?: string };

    const customerId = body.customerId;
    if (!customerId) {
      json(response, 400, { error: "INVALID_REQUEST", message: "customerId is required" });
      return;
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: body.RETURN_URL ?? `${APP_URL}/app/billing`,
      }),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      throw new HttpError(500, "STRIPE_ERROR", err);
    }

    const session = await stripeRes.json() as { url: string };
    json(response, 200, { url: session.url });
  } catch (error) {
    json(response, errorStatus(error), { error: errorCode(error) });
  }
}