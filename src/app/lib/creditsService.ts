const API_BASE = (import.meta.env.VITE_AI_GENERATION_API_URL as string | undefined)?.replace(/\/generate$/, "") || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = (await import("./supabase")).getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("AUTH_REQUIRED");

  const url = `${API_BASE}${path}`.replace(/\/+/g, "/");
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

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

export async function fetchUserCredits(_userId: string): Promise<UserCreditsRecord | null> {
  try {
    const result = await apiFetch<{ credits: { remaining: number; plan: string; monthly_allowance: number; reset_at: string | null } }>("/api/credits");
    return {
      balance: result.credits.remaining,
      quota: result.credits.monthly_allowance || DEFAULT_QUOTA,
      spent: 0,
      resetAt: result.credits.reset_at,
      plan: result.credits.plan,
    };
  } catch {
    return null;
  }
}

export async function upsertUserCredits(
  _userId: string,
  _balance: number,
  _quota: number,
  _resetAt?: string | null,
): Promise<boolean> {
  return true;
}

export async function ensureSignupCredits(_userId: string, _email?: string): Promise<UserCreditsRecord> {
  const existing = await fetchUserCredits(_userId);
  if (existing && existing.balance > 0) return existing;

  const grant = isAdminEmail(_email) ? { balance: ADMIN_CREDITS, quota: ADMIN_CREDITS } : { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };

  try {
    await apiFetch<{ credits: { remaining: number; plan: string; monthly_allowance: number; reset_at: string | null } }>("/api/credits", {
      method: "POST",
      body: JSON.stringify({ action: "grant", amount: grant.balance, type: isAdminEmail(_email) ? "admin_grant" : "trial_grant", reason: "signup" }),
    });
  } catch {
    console.warn("[credits] Backend grant failed, frontend cannot initialize credits");
  }

  return { ...grant, spent: 0, resetAt: new Date().toISOString(), plan: "free" }
}

export async function checkMonthlyRefresh(
  _userId: string,
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
    if (currentBalance <= 0 && elapsedHours >= 24) {
      shouldRefresh = true;
    }
  }

  if (!shouldRefresh) return null;

  try {
    await apiFetch<{ credits: { remaining: number; plan: string; monthly_allowance: number; reset_at: string | null } }>("/api/credits", {
      method: "POST",
      body: JSON.stringify({ action: "grant", amount: planGrant.balance, type: "timed_refill", reason: "monthly refresh" }),
    });
  } catch {
    console.warn("[credits] Monthly refresh failed");
  }

  return { balance: planGrant.balance, quota: planGrant.quota, spent: 0, resetAt: nextResetAt, plan };
}

export async function grantPlanCredits(
  _userId: string,
  planId: string,
  packageCredits?: number,
): Promise<UserCreditsRecord> {
  const planGrant = PLAN_CREDIT_GRANTS[planId] ?? { balance: SIGNUP_CREDITS, quota: DEFAULT_QUOTA };
  const add = packageCredits ?? planGrant.balance;

  try {
    const result = await apiFetch<{ credits: { remaining: number; plan: string; monthly_allowance: number; reset_at: string | null } }>("/api/credits", {
      method: "POST",
      body: JSON.stringify({ action: "grant", amount: add, type: "subscription_grant", reason: `plan:${planId}` }),
    });
    return {
      balance: result.credits.remaining,
      quota: result.credits.monthly_allowance || planGrant.quota,
      spent: 0,
      resetAt: result.credits.reset_at,
      plan: result.credits.plan,
    };
  } catch {
    return { balance: add, quota: planGrant.quota, spent: 0, resetAt: new Date().toISOString(), plan: planId };
  }
}

export async function recordGenerationHistory(record: GenerationHistoryRecord): Promise<void> {
  const supabase = (await import("./supabase")).getSupabase();
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
