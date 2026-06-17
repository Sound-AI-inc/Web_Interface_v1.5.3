import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "grid" | "list";

interface PromptsState {
  viewMode: ViewMode;
  history: string[];
  setViewMode: (mode: ViewMode) => void;
  pushHistory: (prompt: string) => void;
}

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set) => ({
      viewMode: "grid",
      history: [],
      setViewMode: (viewMode) => set({ viewMode }),
      pushHistory: (prompt) => {
        const trimmed = prompt.trim();
        if (trimmed.length < 3) return;
        set((s) => ({
          history: [trimmed, ...s.history.filter((p) => p !== trimmed)].slice(0, 30),
        }));
      },
    }),
    { name: "soundai-prompts-v1" },
  ),
);

export const PROMPT_TEMPLATES = [
  { id: "t1", title: "Dark techno kick", body: "Create dark techno kick with sub tail, 130 BPM, mono compatible" },
  { id: "t2", title: "Cinematic brass", body: "Generate cinematic brass phrase in D minor, epic trailer energy" },
  { id: "t3", title: "Analog bass preset", body: "Design analog bass preset with warm filter movement for house" },
  { id: "t4", title: "Lo-fi piano loop", body: "Dusty upright piano, tape saturation, gentle brush drums, 72 BPM, 4 bars" },
  { id: "t5", title: "Trap hi-hats", body: "Create layered trap hi-hat loop with swing and velocity variation" },
  { id: "t6", title: "Synthwave lead MIDI", body: "Generate MIDI synthwave lead melody in A minor, 110 BPM, 8 bars" },
] as const;

export const PROMPT_CATEGORIES = [
  { key: "genre", label: "Genre", options: ["Lo-fi", "Techno", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Ambient"] },
  { key: "mood", label: "Mood", options: ["Calm", "Dark", "Energetic", "Melancholic", "Uplifting", "Aggressive"] },
  { key: "energy", label: "Energy", options: ["Low", "Medium", "High", "Peak"] },
  { key: "tempo", label: "Tempo", options: ["Slow (60-90)", "Mid (90-120)", "Fast (120-140)", "Very Fast (140+)"] },
  { key: "instrument", label: "Instrument", options: ["Piano", "Synth", "Guitar", "Drums", "Bass", "Strings", "Brass"] },
  { key: "texture", label: "Texture", options: ["Warm", "Bright", "Gritty", "Airy", "Dense", "Minimal"] },
  { key: "complexity", label: "Complexity", options: ["Simple", "Moderate", "Layered", "Experimental"] },
] as const;

export type PromptCategoryKey = (typeof PROMPT_CATEGORIES)[number]["key"];

export type PromptDraft = Record<PromptCategoryKey, string> & { title: string; body: string };

export const EMPTY_PROMPT_DRAFT: PromptDraft = {
  title: "",
  body: "",
  genre: "Lo-fi",
  mood: "Calm",
  energy: "Medium",
  tempo: "Mid (90-120)",
  instrument: "Piano",
  texture: "Warm",
  complexity: "Simple",
};
