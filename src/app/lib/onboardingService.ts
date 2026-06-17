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

export async function fetchOnboardingStatus(userId: string): Promise<OnboardingRecord | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("user_onboarding")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data?.completed_at) {
      return {
        profileType: data.profile_type ?? "",
        discoverySource: data.discovery_source ?? "",
        primaryGoal: data.primary_goal ?? "",
        workflowFrequency: data.workflow_frequency ?? "",
        mainDaw: data.main_daw ?? "",
        painPoint: data.pain_point ?? "",
        completedAt: data.completed_at,
      };
    }
  }
  return readLocal(userId);
}

export async function saveOnboarding(userId: string, payload: OnboardingData): Promise<void> {
  const completedAt = new Date().toISOString();
  const record: OnboardingRecord = { ...payload, completedAt };
  writeLocal(userId, record);

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("user_onboarding").upsert(
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
  );
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
