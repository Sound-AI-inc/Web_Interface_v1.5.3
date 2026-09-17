import type { GenerationType } from "../promptGeneration";
import { getSupabase } from "../supabase";

/**
 * P4-A — Authoritative cost preview without touching the protected credit
 * foundation. Reads the same `/api/credits` endpoint (server-computed
 * `generation_costs` keyed by generation_type) through a local,
 * read-only fetch. Never writes, never deducts, never invents pricing.
 */

export type GenerationCostMap = Record<string, number>;

export interface CostEstimate {
  /** Server unit cost for one result. */
  unit: number;
  /** unit x count. Labelled "Estimate" in UI; the server charge is final. */
  total: number;
  costKey: string;
}

/** Server generation_type keys per frontend generation type + mode. */
function costKeyFor(type: GenerationType, mode: "lite" | "pro"): string[] {
  if (type === "MIDI Melody") return ["midi"];
  if (type === "VST Preset") return ["vst_preset"];
  return mode === "pro" ? ["advanced_audio", "audio_sample"] : ["audio_sample", "advanced_audio"];
}

export function estimateCost(
  type: GenerationType,
  mode: "lite" | "pro",
  count: number,
  costs: GenerationCostMap | null | undefined,
): CostEstimate | null {
  if (!costs) return null;
  for (const key of costKeyFor(type, mode)) {
    const unit = Number(costs[key]);
    if (Number.isFinite(unit) && unit > 0) {
      return { unit, total: unit * Math.max(1, count), costKey: key };
    }
  }
  return null;
}

interface CreditsEndpointResponse {
  credits?: {
    balance?: number;
    monthly_allowance?: number;
    generation_costs?: GenerationCostMap;
  };
}

/** Read-only fetch of the server cost map. Returns null when unavailable —
 *  callers must render "Cost unavailable", never a guessed price. */
export async function fetchGenerationCostMap(): Promise<GenerationCostMap | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return null;
    const base = (
      (import.meta.env.VITE_AI_GENERATION_API_URL as string | undefined)?.replace(/\/generate$/, "") || ""
    ).replace(/\/+$/g, "");
    const url = `${base}/api/credits`.replace(/\/+/g, "/");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as CreditsEndpointResponse;
    const costs = body.credits?.generation_costs;
    return costs && typeof costs === "object" ? costs : null;
  } catch {
    return null;
  }
}
