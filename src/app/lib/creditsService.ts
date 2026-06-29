import { getSupabase } from "./supabase";

export const SIGNUP_CREDITS = 20;
export const DEFAULT_QUOTA = 20;

/** Credits granted when a paid plan is activated (mock until Stripe webhook). */
export const PLAN_CREDIT_GRANTS: Record<string, { balance: number; quota: number }> = {
  trial: { balance: 20, quota: 20 },
  free: { balance: 20, quota: 20 },
  standard: { balance: 30, quota: 30 },
  premium: { balance: 50, quota: 50 },
  enterprise: { balance: 500, quota: 500 },
};

export interface UserCreditsRecord {
  balance: number;
  quota: number;
  spent: number;
}

export interface GenerationHistoryRecord {
  userId: string | null;
  projectId: string | null;
  prompt: string;
  generationType: string;
  model: string;
  format: string;
  count: number;
  creditsSpent: number;
  status: "success" | "failed";
  generationId?: string;
}

export async function fetchUserCredits(userId: string): Promise<UserCreditsRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_credits")
    .select("balance, quota, credits_spent")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return {
      balance: typeof data.balance === "number" ? data.balance : SIGNUP_CREDITS,
      quota: typeof data.quota === "number" ? data.quota : DEFAULT_QUOTA,
      spent: typeof data.credits_spent === "number" ? data.credits_spent : 0,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance, credits_quota")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    return {
      balance:
        typeof profile.credits_balance === "number" ? profile.credits_balance : SIGNUP_CREDITS,
      quota: typeof profile.credits_quota === "number" ? profile.credits_quota : DEFAULT_QUOTA,
      spent: 0,
    };
  }

  return null;
}

export async function upsertUserCredits(
  userId: string,
  balance: number,
  quota: number,
  creditsSpent?: number,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;

  const payload = {
    user_id: userId,
    balance,
    quota,
    updated_at: new Date().toISOString(),
    ...(typeof creditsSpent === "number" ? { credits_spent: creditsSpent } : {}),
  };

  const { error } = await supabase.from("user_credits").upsert(payload);
  if (!error) return true;

  if (typeof creditsSpent === "number") {
    const { error: fallbackError } = await supabase.from("user_credits").upsert({
      user_id: userId,
      balance,
      quota,
      updated_at: new Date().toISOString(),
    });
    return !fallbackError;
  }

  return false;
}

/** Grant 20 credits to a brand-new user (idempotent). */
export async function ensureSignupCredits(userId: string): Promise<UserCreditsRecord> {
  const existing = await fetchUserCredits(userId);
  if (existing) return existing;

  const grant = { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  await upsertUserCredits(userId, grant.balance, grant.quota, 0);
  return { ...grant, spent: 0 };
}

/** Add credits after subscription / one-time plan purchase. */
export async function grantPlanCredits(
  userId: string,
  planId: string,
  packageCredits?: number,
): Promise<UserCreditsRecord> {
  const planGrant = PLAN_CREDIT_GRANTS[planId] ?? { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  const add = packageCredits ?? planGrant.balance;

  const existing = await fetchUserCredits(userId);
  const nextBalance = (existing?.balance ?? 0) + add;
  const nextQuota = Math.max(existing?.quota ?? DEFAULT_QUOTA, packageCredits ?? planGrant.quota);

  await upsertUserCredits(userId, nextBalance, nextQuota, existing?.spent ?? 0);
  return { balance: nextBalance, quota: nextQuota, spent: existing?.spent ?? 0 };
}

export async function recordGenerationHistory(record: GenerationHistoryRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !record.userId) return;

  await supabase.from("generation_history").insert({
    user_id: record.userId,
    project_id: record.projectId,
    generation_id: record.generationId ?? null,
    prompt: record.prompt,
    generation_type: record.generationType,
    model_used: record.model,
    format: record.format,
    count: record.count,
    credits_spent: record.creditsSpent,
    status: record.status,
    generated_at: new Date().toISOString(),
  });
}
