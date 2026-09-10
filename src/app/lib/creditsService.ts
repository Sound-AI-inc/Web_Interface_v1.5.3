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

interface CreditsResponse {
  credits: {
    balance: number;
    reserved: number;
    plan: string;
    monthly_allowance: number;
    last_refill_at: string | null;
    next_refill_at: string | null;
    subscription_status: string | null;
    generation_costs: Record<string, number>;
    entitlements: Record<string, unknown>;
  };
}

export async function fetchUserCredits(_userId: string): Promise<UserCreditsRecord | null> {
  try {
    const result = await apiFetch<CreditsResponse>("/api/credits");
    return {
      balance: result.credits.balance,
      quota: result.credits.monthly_allowance || DEFAULT_QUOTA,
      spent: Math.max(0, (result.credits.monthly_allowance || DEFAULT_QUOTA) - result.credits.balance),
      resetAt: result.credits.next_refill_at,
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
  // No-op: credits are server-authoritative. Grants are server-initiated only.
  return true;
}

export async function ensureSignupCredits(_userId: string, _email?: string): Promise<UserCreditsRecord> {
  // Signup credits are granted server-side via the auth trigger / subscription webhook.
  // This function now just fetches the current state.
  const existing = await fetchUserCredits(_userId);
  if (existing) return existing;
  return { balance: 0, quota: DEFAULT_QUOTA, spent: 0, resetAt: null, plan: "free" };
}

export async function checkMonthlyRefresh(
  _userId: string,
  _plan: string,
  _currentBalance: number,
  _currentResetAt: string | null,
): Promise<UserCreditsRecord | null> {
  // Refill is server-initiated. The frontend should not trigger grants.
  return null;
}

export async function grantPlanCredits(
  _userId: string,
  _planId: string,
  _packageCredits?: number,
): Promise<UserCreditsRecord> {
  // Grants are now server-initiated via Stripe webhooks / subscription lifecycle.
  // This function is kept for backward compatibility but delegates to the server.
  const result = await fetchUserCredits(_userId);
  if (result) return result;
  return { balance: 0, quota: DEFAULT_QUOTA, spent: 0, resetAt: null, plan: _planId };
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
