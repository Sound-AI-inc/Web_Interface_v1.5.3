import { getSupabase } from "./supabase";

export interface OnboardingData {
  profileType: string;
  discoverySource: string;
  primaryGoal: string;
  workflowFrequency: string;
  mainDaw: string;
  painPoint: string;
}

export interface OnboardingRecord extends OnboardingData {
  completedAt: string;
}

const localKey = (userId: string) => `soundai:onboarding:${userId}`;
const BYPASS_KEY = "soundai:onboarding-bypass";
const NEEDS_KEY = "soundai:needs-onboarding";

/** Account created within this window is treated as a new registration. */
const NEW_USER_WINDOW_MS = 24 * 60 * 60 * 1000;

function readLocal(userId: string): OnboardingRecord | null {
  try {
    const raw = localStorage.getItem(localKey(userId));
    return raw ? (JSON.parse(raw) as OnboardingRecord) : null;
  } catch {
    return null;
  }
}

function writeLocal(userId: string, data: OnboardingRecord) {
  localStorage.setItem(localKey(userId), JSON.stringify(data));
}

export function isOnboardingCompleteSync(userId: string): boolean {
  return Boolean(readLocal(userId)?.completedAt);
}

export function isRecentlyCreatedUser(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < NEW_USER_WINDOW_MS;
}

/** Set when the user starts sign-up (email or OAuth from /sign-up). */
export function markNeedsOnboarding(userId: string) {
  sessionStorage.setItem(NEEDS_KEY, userId);
}

export function clearNeedsOnboarding(userId: string) {
  if (sessionStorage.getItem(NEEDS_KEY) === userId) {
    sessionStorage.removeItem(NEEDS_KEY);
  }
}

export function requiresOnboarding(userId: string): boolean {
  return sessionStorage.getItem(NEEDS_KEY) === userId;
}

/** Immediate bypass so AppLayout does not block navigation after finishing onboarding. */
export function markOnboardingBypass(userId: string) {
  sessionStorage.setItem(BYPASS_KEY, userId);
}

export function consumeOnboardingBypass(userId: string): boolean {
  const value = sessionStorage.getItem(BYPASS_KEY);
  if (value === userId) {
    sessionStorage.removeItem(BYPASS_KEY);
    return true;
  }
  return false;
}

/**
 * Only brand-new sign-ups should see the survey.
 * Existing users signing in are never gated.
 */
export function shouldRequireOnboarding(userId: string, createdAt?: string): boolean {
  if (isOnboardingCompleteSync(userId)) return false;
  if (requiresOnboarding(userId)) return true;
  return isRecentlyCreatedUser(createdAt);
}

function mapRow(data: Record<string, unknown>): OnboardingRecord | null {
  const completedAt = data.completed_at as string | undefined;
  if (!completedAt) return null;
  return {
    profileType: (data.profile_type as string) ?? "",
    discoverySource: (data.discovery_source as string) ?? "",
    primaryGoal: (data.primary_goal as string) ?? "",
    workflowFrequency: (data.workflow_frequency as string) ?? "",
    mainDaw: (data.main_daw as string) ?? "",
    painPoint: (data.pain_point as string) ?? "",
    completedAt,
  };
}

async function fetchFromSupabase(userId: string): Promise<OnboardingRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await Promise.race([
      supabase.from("user_onboarding").select("*").eq("user_id", userId).maybeSingle(),
      new Promise<{ data: null; error: { message: string } }>((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), 5000);
      }),
    ]);
    if (error) {
      console.warn("[onboarding] Supabase fetch failed:", error.message);
      return null;
    }
    return data ? mapRow(data as Record<string, unknown>) : null;
  } catch (err) {
    console.warn("[onboarding] Supabase fetch error:", err);
    return null;
  }
}

export async function fetchOnboardingStatus(userId: string): Promise<OnboardingRecord | null> {
  if (consumeOnboardingBypass(userId)) {
    const local = readLocal(userId);
    if (local) return local;
  }

  const local = readLocal(userId);
  if (local?.completedAt) return local;

  const remote = await fetchFromSupabase(userId);
  if (remote) {
    writeLocal(userId, remote);
    clearNeedsOnboarding(userId);
    return remote;
  }

  return readLocal(userId);
}

async function syncToSupabase(userId: string, payload: OnboardingData, completedAt: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await Promise.race([
      supabase.from("user_onboarding").upsert(
        {
          user_id: userId,
          profile_type: payload.profileType,
          discovery_source: payload.discoverySource,
          primary_goal: payload.primaryGoal,
          workflow_frequency: payload.workflowFrequency,
          main_daw: payload.mainDaw,
          pain_point: payload.painPoint,
          completed_at: completedAt,
        },
        { onConflict: "user_id" },
      ),
      new Promise<{ error: { message: string } }>((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), 8000);
      }),
    ]);
    if (error) {
      console.warn("[onboarding] Supabase save failed:", error.message);
    }
  } catch (err) {
    console.warn("[onboarding] Supabase save error:", err);
  }
}

export async function saveOnboarding(userId: string, payload: OnboardingData): Promise<void> {
  const completedAt = new Date().toISOString();
  const record: OnboardingRecord = { ...payload, completedAt };
  writeLocal(userId, record);
  markOnboardingBypass(userId);
  clearNeedsOnboarding(userId);
  void syncToSupabase(userId, payload, completedAt);
}

export const ONBOARDING_STEPS = [
  {
    key: "profileType" as const,
    questionKey: "onboarding.profile.question" as const,
    options: [
      "onboarding.profile.musicProducer",
      "onboarding.profile.beatmaker",
      "onboarding.profile.composer",
      "onboarding.profile.soundDesigner",
      "onboarding.profile.mixingEngineer",
      "onboarding.profile.contentCreator",
      "onboarding.profile.podcastCreator",
      "onboarding.profile.videoCreator",
      "onboarding.profile.gameAudio",
      "onboarding.profile.student",
      "onboarding.profile.other",
    ],
  },
  {
    key: "discoverySource" as const,
    questionKey: "onboarding.discovery.question" as const,
    options: [
      "onboarding.discovery.google",
      "onboarding.discovery.youtube",
      "onboarding.discovery.tiktok",
      "onboarding.discovery.instagram",
      "onboarding.discovery.productHunt",
      "onboarding.discovery.reddit",
      "onboarding.discovery.friend",
      "onboarding.discovery.discord",
      "onboarding.discovery.newsletter",
      "onboarding.discovery.other",
    ],
  },
  {
    key: "primaryGoal" as const,
    questionKey: "onboarding.goal.question" as const,
    options: [
      "onboarding.goal.audioSamples",
      "onboarding.goal.midi",
      "onboarding.goal.vstPresets",
      "onboarding.goal.soundFx",
      "onboarding.goal.musicIdeas",
      "onboarding.goal.templates",
    ],
  },
  {
    key: "workflowFrequency" as const,
    questionKey: "onboarding.frequency.question" as const,
    options: [
      "onboarding.frequency.daily",
      "onboarding.frequency.weekly",
      "onboarding.frequency.monthly",
      "onboarding.frequency.occasionally",
    ],
  },
  {
    key: "mainDaw" as const,
    questionKey: "onboarding.daw.question" as const,
    options: [
      "onboarding.daw.ableton",
      "onboarding.daw.flStudio",
      "onboarding.daw.logic",
      "onboarding.daw.cubase",
      "onboarding.daw.studioOne",
      "onboarding.daw.reaper",
      "onboarding.daw.proTools",
      "onboarding.daw.other",
    ],
  },
  {
    key: "painPoint" as const,
    questionKey: "onboarding.pain.question" as const,
    options: [
      "onboarding.pain.soundDesign",
      "onboarding.pain.sampleSearch",
      "onboarding.pain.midiWriting",
      "onboarding.pain.arrangement",
      "onboarding.pain.mixing",
      "onboarding.pain.presetCreation",
      "onboarding.pain.inspiration",
    ],
  },
] as const;
