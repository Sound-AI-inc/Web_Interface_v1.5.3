import { getSupabase } from "./supabase";

export const SIGNUP_CREDITS = 20;
export const DEFAULT_QUOTA = 20;

export const PLAN_CREDIT_GRANTS: Record<string, { balance: number; quota: number }> = {
  trial: { balance: 20, quota: 20 },
  free: { balance: 20, quota: 20 },
  standard: { balance: 30, quota: 30 },
  premium: { balance: 50, quota: 50 },
  enterprise: { balance: 500, quota: 500 },
};

export const ADMIN_EMAILS = new Set(["soundai.inc@gmail.com"]);
export const ADMIN_CREDITS = 5000;

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export async function grantAdminCredits(userId: string): Promise<boolean> {
  return upsertUserCredits(userId, ADMIN_CREDITS, ADMIN_CREDITS, new Date().toISOString());
}

export interface UserCreditsRecord {
  balance: number;
  quota: number;
  spent: number;
  resetAt: string | null;
  plan: string;
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

/**
 * Single source of truth for credits: public.profiles
 * Columns: credits_balance, credits_quota, credits_reset_at, plan
 */
export async function fetchUserCredits(userId: string): Promise<UserCreditsRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("credits_balance, credits_quota, credits_reset_at, plan")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[credits] Supabase fetch failed:", error.message);
      return null;
    }

    if (data) {
      return {
        balance: typeof data.credits_balance === "number" ? data.credits_balance : SIGNUP_CREDITS,
        quota: typeof data.credits_quota === "number" ? data.credits_quota : DEFAULT_QUOTA,
        spent: 0,
        resetAt: data.credits_reset_at ?? null,
        plan: (data.plan as string) ?? "free",
      };
    }
  } catch (err) {
    console.warn("[credits] Supabase fetch error:", err);
  }

  return null;
}

export async function upsertUserCredits(
  userId: string,
  balance: number,
  quota: number,
  resetAt?: string | null,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        credits_balance: balance,
        credits_quota: quota,
        credits_reset_at: resetAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn("[credits] Supabase upsert failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[credits] Supabase upsert error:", err);
    return false;
  }
}

/**
 * Grant initial signup credits. Idempotent: only grants if balance is 0/missing.
 * Admin emails get 5000 credits.
 */
export async function ensureSignupCredits(userId: string, email?: string): Promise<UserCreditsRecord> {
  if (isAdminEmail(email)) {
    await grantAdminCredits(userId);
    return { balance: ADMIN_CREDITS, quota: ADMIN_CREDITS, spent: 0, resetAt: new Date().toISOString(), plan: "free" };
  }

  const existing = await fetchUserCredits(userId);
  if (existing && existing.balance > 0) return existing;

  const grant = { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  const saved = await upsertUserCredits(userId, grant.balance, grant.quota);
  if (saved) {
    console.info("[credits] Signup credits initialized for user", userId);
  } else {
    console.warn("[credits] Failed to initialize signup credits for user", userId);
  }
  return { ...grant, spent: 0, resetAt: new Date().toISOString(), plan: "free" };
}

/**
 * Check if monthly credit refresh is due for paid plans.
 * Refreshes when balance <= 0 and at least 24h have passed since last reset.
 */
const MONTHLY_REFRESH_HOURS = 24;

export async function checkMonthlyRefresh(
  userId: string,
  plan: string,
  currentBalance: number,
  currentResetAt: string | null,
): Promise<UserCreditsRecord | null> {
  if (plan === "free" || plan === "trial") return null;

  const planGrant = PLAN_CREDIT_GRANTS[plan];
  if (!planGrant) return null;

  const now = Date.now();
  let nextResetAt = currentResetAt;
  let shouldRefresh = false;

  if (!currentResetAt) {
    nextResetAt = new Date(now).toISOString();
    if (currentBalance <= 0) shouldRefresh = true;
  } else {
    const lastReset = new Date(currentResetAt).getTime();
    const elapsedHours = (now - lastReset) / (1000 * 60 * 60);
    if (currentBalance <= 0 && elapsedHours >= MONTHLY_REFRESH_HOURS) {
      shouldRefresh = true;
    }
  }

  if (!shouldRefresh) return null;

  await upsertUserCredits(userId, planGrant.balance, planGrant.quota, nextResetAt);
  console.info("[credits] Monthly refresh applied for user", userId, "plan", plan);
  return { balance: planGrant.balance, quota: planGrant.quota, spent: 0, resetAt: nextResetAt, plan };
}

/**
 * Add credits after subscription / plan purchase.
 */
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

  await upsertUserCredits(userId, nextBalance, nextQuota, existing?.resetAt ?? new Date().toISOString());
  return { balance: nextBalance, quota: nextQuota, spent: 0, resetAt: existing?.resetAt ?? new Date().toISOString(), plan: planId };
}

export async function recordGenerationHistory(record: GenerationHistoryRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !record.userId) return;

  await supabase.from("generation_logs").insert({
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
