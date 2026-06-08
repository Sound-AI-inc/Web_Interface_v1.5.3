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

export async function fetchUserCredits(userId: string): Promise<{ balance: number; quota: number } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_credits")
    .select("balance, quota")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return {
      balance: typeof data.balance === "number" ? data.balance : SIGNUP_CREDITS,
      quota: typeof data.quota === "number" ? data.quota : DEFAULT_QUOTA,
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
    };
  }

  return null;
}

export async function upsertUserCredits(
  userId: string,
  balance: number,
  quota: number,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("user_credits").upsert({
    user_id: userId,
    balance,
    quota,
    updated_at: new Date().toISOString(),
  });
}

/** Grant 20 credits to a brand-new user (idempotent). */
export async function ensureSignupCredits(userId: string): Promise<{ balance: number; quota: number }> {
  const existing = await fetchUserCredits(userId);
  if (existing) return existing;

  const grant = { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  await upsertUserCredits(userId, grant.balance, grant.quota);
  return grant;
}

/** Add credits after subscription / one-time plan purchase. */
export async function grantPlanCredits(
  userId: string,
  planId: string,
  packageCredits?: number,
): Promise<{ balance: number; quota: number }> {
  const planGrant = PLAN_CREDIT_GRANTS[planId] ?? { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  const add = packageCredits ?? planGrant.balance;

  const existing = await fetchUserCredits(userId);
  const nextBalance = (existing?.balance ?? 0) + add;
  const nextQuota = Math.max(existing?.quota ?? DEFAULT_QUOTA, packageCredits ?? planGrant.quota);

  await upsertUserCredits(userId, nextBalance, nextQuota);
  return { balance: nextBalance, quota: nextQuota };
}
