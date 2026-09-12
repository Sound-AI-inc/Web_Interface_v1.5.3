import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerRuntime } from "../src/app/lib/ai/runtime";
import { resolveUserTier } from "./_lib/auth";
import { isAdminUser, getAdminBalance } from "./_lib/admin";
import { errorStatus, errorCode, HttpError } from "./_lib/http";

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

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  assertServerRuntime();

  if (request.method === "GET") {
    try {
      const supabase = getServerSupabase();
      const authUser = await resolveUserTier(supabase, request);

      const adminBalance = getAdminBalance();
      const isAdmin = isAdminUser(authUser.email);

      if (isAdmin && adminBalance > 0) {
        json(response, 200, {
          credits: {
            balance: adminBalance,
            reserved: 0,
            plan: authUser.tier,
            monthly_allowance: adminBalance,
            last_refill_at: null,
            next_refill_at: null,
            subscription_status: "admin_override",
            generation_costs: {},
            entitlements: {},
            admin_override: true,
          },
        });
        return;
      }

      const { data, error } = await supabase
        .from("user_credits")
        .select("balance, reserved, plan, monthly_allowance, last_refill_at, next_refill_at, subscription_status")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (error) {
        json(response, 500, { error: "CREDITS_FETCH_FAILED", message: error.message });
        return;
      }

      // Resolve entitlements from the plan.
      const planId = data?.plan ?? authUser.tier;
      const { data: entitlements } = await supabase
        .from("plan_entitlements")
        .select("feature_key, enabled, value")
        .eq("plan_id", planId);

      const entitlementMap: Record<string, unknown> = {};
      for (const row of entitlements ?? []) {
        if (row.enabled) {
          entitlementMap[row.feature_key] = row.value;
        }
      }

      // Resolve generation costs.
      const { data: costConfig } = await supabase
        .from("generation_cost_config")
        .select("generation_type, credit_cost")
        .eq("is_active", true);

      const costs: Record<string, number> = {};
      for (const row of costConfig ?? []) {
        costs[row.generation_type] = Number(row.credit_cost);
      }

      const credits = data ?? {
        balance: 0,
        reserved: 0,
        plan: authUser.tier,
        monthly_allowance: 0,
        last_refill_at: null,
        next_refill_at: null,
        subscription_status: null,
      };

      const balance = Number(credits.balance);
      json(response, 200, {
        credits: {
          balance,
          remaining: balance,
          reserved: Number(credits.reserved),
          plan: credits.plan,
          monthly_allowance: Number(credits.monthly_allowance),
          last_refill_at: credits.last_refill_at,
          next_refill_at: credits.next_refill_at,
          subscription_status: credits.subscription_status,
          generation_costs: costs,
          entitlements: entitlementMap,
        },
      });
    } catch (error) {
      json(response, errorStatus(error), {
        error: errorCode(error),
      });
    }
    return;
  }

  // POST is no longer open for arbitrary grants. Grants are server-initiated only
  // (signup, subscription lifecycle, refill, admin override via env).
  if (request.method === "POST") {
    json(response, 403, {
      error: "GRANT_NOT_ALLOWED",
      message: "Credit grants are server-initiated. Use the subscription or refill endpoints.",
    });
    return;
  }

  json(response, 405, { error: "Method not allowed" });
}
