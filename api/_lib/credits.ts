import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelOutputType } from "../../src/app/lib/ai/types";
import { HttpError } from "./http";

const creditCost: Record<ModelOutputType, number> = {
  audio: 10,
  midi: 4,
  preset: 6,
};

export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  generationType: ModelOutputType,
  generationId?: string,
): Promise<{ cost: number; remaining: number }> {
  const cost = creditCost[generationType];
  const { data, error } = await supabase.schema("private").rpc("consume_user_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_type: "generation_spend",
    p_reason: `Generation type: ${generationType}`,
    p_generation_id: generationId ?? null,
    p_plan: "free",
  });

  if (error) throw new HttpError(402, "INSUFFICIENT_CREDITS", error.message);
  const remaining = Number(data);
  if (!Number.isFinite(remaining)) throw new HttpError(402, "INSUFFICIENT_CREDITS", "Insufficient credits");
  return { cost, remaining };
}
