import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelOutputType } from "../../src/app/lib/ai/types";
import { HttpError } from "./http";

function mapOutputTypeToGenerationType(outputType: ModelOutputType): string {
  if (outputType === "audio") return "audio_sample";
  if (outputType === "preset") return "vst_preset";
  return outputType;
}

export interface CreditResult {
  cost: number;
  remaining: number;
  balance: number;
  reserved: number;
}

/**
 * Resolve the server-authoritative generation cost from generation_cost_config.
 * Multiplies by count for batched generations.
 */
export async function resolveGenerationCost(
  supabase: SupabaseClient,
  generationType: string,
  count: number,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_generation_cost", {
    p_generation_type: generationType,
    p_count: Math.max(1, count),
  });

  if (error || data == null) {
    throw new HttpError(400, "UNKNOWN_MODEL", error?.message ?? "Could not resolve generation cost");
  }
  return Number(data);
}

/**
 * Reserve credits before generation begins.
 * Throws INSUFFICIENT_CREDITS if balance is insufficient.
 */
export async function reserveCredits(
  supabase: SupabaseClient,
  userId: string,
  generationType: ModelOutputType,
  count: number,
  generationId?: string,
): Promise<CreditResult> {
  const cost = await resolveGenerationCost(supabase, mapOutputTypeToGenerationType(generationType), count);
  const { data, error } = await supabase.rpc("reserve_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_generation_id: generationId ?? null,
    p_reason: `Generation type: ${generationType}`,
  });

  if (error) {
    if (error.message?.includes("INSUFFICIENT_CREDITS") || error.code === "P0001") {
      throw new HttpError(402, "INSUFFICIENT_CREDITS", "Insufficient credits");
    }
    throw new HttpError(500, "CREDIT_RESERVE_FAILED", error.message);
  }

  const record = await supabase
    .from("user_credits")
    .select("balance, reserved")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    cost,
    remaining: Number(data),
    balance: Number(record.data?.balance ?? 0),
    reserved: Number(record.data?.reserved ?? 0),
  };
}

/**
 * Consume reserved credits after successful generation.
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  generationId?: string,
): Promise<CreditResult> {
  // Look up the reserved amount for this generation from the ledger.
  const { data: txData } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "generation_reserve")
    .eq("generation_id", generationId ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cost = txData ? Number(txData.amount) : 0;

  if (cost <= 0) {
    // No reservation found — treat as a no-op (admin override or free tier).
    const { data: record } = await supabase
      .from("user_credits")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      cost: 0,
      remaining: Number(record.data?.balance ?? 0),
      balance: Number(record.data?.balance ?? 0),
      reserved: Number(record.data?.reserved ?? 0),
    };
  }

  const { data, error } = await supabase.rpc("consume_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_generation_id: generationId ?? null,
    p_reason: "Generation completed successfully",
  });

  if (error) {
    throw new HttpError(500, "CREDIT_CONSUME_FAILED", error.message);
  }

  const record = await supabase
    .from("user_credits")
    .select("balance, reserved")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    cost,
    remaining: Number(data),
    balance: Number(record.data?.balance ?? 0),
    reserved: Number(record.data?.reserved ?? 0),
  };
}

/**
 * Restore reserved credits after failed generation.
 */
export async function restoreCredits(
  supabase: SupabaseClient,
  userId: string,
  generationId?: string,
  reason?: string,
): Promise<CreditResult> {
  const { data: txData } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "generation_reserve")
    .eq("generation_id", generationId ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const cost = txData ? Number(txData.amount) : 0;

  if (cost <= 0) {
    const { data: record } = await supabase
      .from("user_credits")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      cost: 0,
      remaining: Number(record.data?.balance ?? 0),
      balance: Number(record.data?.balance ?? 0),
      reserved: Number(record.data?.reserved ?? 0),
    };
  }

  const { data, error } = await supabase.rpc("restore_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_generation_id: generationId ?? null,
    p_reason: reason ?? "Generation failed; credits restored",
  });

  if (error) {
    throw new HttpError(500, "CREDIT_RESTORE_FAILED", error.message);
  }

  const record = await supabase
    .from("user_credits")
    .select("balance, reserved")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    cost,
    remaining: Number(data),
    balance: Number(record.data?.balance ?? 0),
    reserved: Number(record.data?.reserved ?? 0),
  };
}

/**
 * Fetch current credit state from the server.
 */
export async function fetchCreditState(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ balance: number; reserved: number; plan: string; monthly_allowance: number; subscription_status: string | null } | null> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("balance, reserved, plan, monthly_allowance, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    balance: Number(data.balance),
    reserved: Number(data.reserved),
    plan: data.plan,
    monthly_allowance: Number(data.monthly_allowance),
    subscription_status: data.subscription_status,
  };
}
