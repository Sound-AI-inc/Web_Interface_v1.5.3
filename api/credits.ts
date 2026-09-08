import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerRuntime } from "../src/app/lib/ai/runtime";
import { resolveUserTier } from "./_lib/auth";
import { isAdminUser, getAdminBalance } from "./_lib/admin";
import { errorStatus, errorCode, HttpError } from "./_lib/http";
import { readJson } from "./_lib/readJson";

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

async function grantCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  type: string,
  reason: string | null,
  plan: string,
): Promise<{ remaining: number; plan: string; monthly_allowance: number; reset_at: string | null }> {
  const isAdmin = isAdminUser(null);
  const adminBalance = getAdminBalance();

  if (type === "admin_grant" && isAdmin && adminBalance > 0) {
    const { data, error } = await supabase
      .from("user_credits")
      .upsert(
        {
          user_id: userId,
          remaining: adminBalance,
          plan: plan,
          monthly_allowance: adminBalance,
          reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("remaining, plan, monthly_allowance, reset_at")
      .single();

    if (error) throw error;
    return {
      remaining: Number(data.remaining),
      plan: data.plan,
      monthly_allowance: Number(data.monthly_allowance),
      reset_at: data.reset_at,
    };
  }

  const { data, error } = await supabase.schema("private").rpc("grant_user_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_reason: reason,
    p_plan: plan,
  });

  if (error) throw new Error(error.message);
  const remaining = Number(data);

  const record = await supabase
    .from("user_credits")
    .select("remaining, plan, monthly_allowance, reset_at")
    .eq("user_id", userId)
    .single();

  const creditData = record.data;
  if (record.error || !creditData) {
    return { remaining, plan, monthly_allowance: amount, reset_at: new Date().toISOString() };
  }

  return {
    remaining: Number(creditData.remaining),
    plan: creditData.plan,
    monthly_allowance: Number(creditData.monthly_allowance),
    reset_at: creditData.reset_at,
  };
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
            remaining: adminBalance,
            plan: authUser.tier,
            monthly_allowance: adminBalance,
            reset_at: null,
            admin_override: true,
          },
        });
        return;
      }

      const { data, error } = await supabase
        .from("user_credits")
        .select("remaining, plan, monthly_allowance, reset_at")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (error) {
        json(response, 500, { error: "CREDITS_FETCH_FAILED", message: error.message });
        return;
      }

      const credits = data ?? {
        remaining: 0,
        plan: authUser.tier,
        monthly_allowance: 0,
        reset_at: null,
      };

      json(response, 200, {
        credits: {
          remaining: Number(credits.remaining) ?? 0,
          plan: credits.plan ?? authUser.tier,
          monthly_allowance: Number(credits.monthly_allowance) ?? 0,
          reset_at: credits.reset_at ?? null,
        },
      });
    } catch (error) {
      json(response, errorStatus(error), {
        error: errorCode(error),
      });
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const supabase = getServerSupabase();
      const authUser = await resolveUserTier(supabase, request);
      const body = await readJson<{ action?: string; amount?: number; type?: string; reason?: string }>(request);

      if (body.action !== "grant" || typeof body.amount !== "number") {
        json(response, 400, { error: "INVALID_REQUEST", message: "Expected action=grant with amount" });
        return;
      }

      const result = await grantCredits(
        supabase,
        authUser.id,
        body.amount,
        body.type || "adjustment",
        body.reason || null,
        authUser.tier,
      );

      json(response, 200, {
        credits: {
          remaining: result.remaining,
          plan: result.plan,
          monthly_allowance: result.monthly_allowance,
          reset_at: result.reset_at,
        },
      });
    } catch (error) {
      json(response, errorStatus(error), {
        error: errorCode(error),
      });
    }
    return;
  }

  json(response, 405, { error: "Method not allowed" });
}
