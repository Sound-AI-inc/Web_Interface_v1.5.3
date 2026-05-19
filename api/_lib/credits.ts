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
): Promise<{ cost: number; remaining: number }> {
  const cost = creditCost[generationType];
  const { data, error } = await supabase.schema("private").rpc("consume_generation_credits", {
    p_user_id: userId,
    p_generation_type: generationType,
    p_cost: cost,
  });

  if (error) throw new HttpError(402, "INSUFFICIENT_CREDITS", error.message);
  const remaining = Number(data);
  if (!Number.isFinite(remaining)) throw new HttpError(402, "INSUFFICIENT_CREDITS", "Insufficient credits");
  return { cost, remaining };
}
