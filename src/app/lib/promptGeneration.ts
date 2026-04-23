import type { AudioResult, MidiNoteLite, PresetGlance, ResultKind } from "../data/mock";

/**
 * Deterministic FNV-1a hash so identical prompts always produce identical
 * previews. This lets the user build trust that the same text yields the
 * same output without needing a real backend round-trip.
 */
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Keyword buckets — words in the prompt nudge the generated result toward a
 * musical style. Matching is substring-based and case-insensitive.
 */
const GENRES = [
  { key: ["lofi", "lo-fi", "chill"], name: "Lo-fi", scale: [0, 3, 5, 7, 10], tempo: 82 },
  { key: ["house", "techno", "edm", "club", "dance"], name: "House", scale: [0, 2, 3, 5, 7, 10], tempo: 124 },
  { key: ["trap", "hip hop", "hiphop", "rap"], name: "Trap", scale: [0, 2, 3, 5, 7, 8, 10], tempo: 140 },
  { key: ["ambient", "cinematic", "pad", "dream"], name: "Ambient", scale: [0, 2, 4, 7, 9], tempo: 70 },
  { key: ["jazz", "swing", "bossa"], name: "Jazz", scale: [0, 2, 3, 5, 7, 9, 10], tempo: 96 },
  { key: ["rock", "metal", "punk", "guitar"], name: "Rock", scale: [0, 2, 3, 5, 7, 8, 10], tempo: 120 },
  { key: ["pop", "upbeat", "happy", "bright"], name: "Pop", scale: [0, 2, 4, 5, 7, 9, 11], tempo: 110 },
  { key: ["synth", "retro", "80s", "vaporwave"], name: "Synthwave", scale: [0, 2, 3, 7, 8, 10], tempo: 100 },
];

const MOODS = [
  { key: ["sad", "melancholic", "dark", "moody", "cold"], name: "Melancholic" },
  { key: ["happy", "bright", "uplifting", "summer"], name: "Uplifting" },
  { key: ["dreamy", "ethereal", "soft", "warm"], name: "Dreamy" },
  { key: ["aggressive", "intense", "hard", "heavy"], name: "Intense" },
  { key: ["mellow", "relaxed", "smooth", "groovy"], name: "Mellow" },
];

function pickBy<T extends { key: string[] }>(buckets: T[], prompt: string, fallback: T): T {
  const p = prompt.toLowerCase();
  for (const b of buckets) {
    if (b.key.some((k) => p.includes(k))) return b;
  }
  return fallback;
}

function firstKeyword(prompt: string): string | null {
  const match = prompt.match(/[A-Za-zА-Яа-я]{3,}/);
  return match ? match[0] : null;
}

function title(prompt: string, genreName: string, moodName: string, variant: number): string {
  const kw = firstKeyword(prompt);
  if (!kw) return `${moodName} ${genreName} Sketch ${variant + 1}`;
  const cap = kw[0].toUpperCase() + kw.slice(1).toLowerCase();
  const suffixes = ["Loop", "Sketch", "Groove", "Idea", "Motif"];
  return `${cap} ${genreName} ${suffixes[variant % suffixes.length]}`;
}

function buildMelody(rand: () => number, scale: number[], root: number, bars: number): MidiNoteLite[] {
  const notes: MidiNoteLite[] = [];
  const stepSec = 0.25;
  const total = Math.floor(bars * 16);
  let t = 0;
  let last = root;
  for (let i = 0; i < total; i++) {
    if (rand() < 0.18) {
      t += stepSec;
      continue;
    }
    const stepIdx = Math.floor(rand() * scale.length);
    const octaveOffset = (Math.floor(rand() * 3) - 1) * 12;
    const pitch = root + scale[stepIdx] + octaveOffset;
    const jump = Math.abs(pitch - last);
    const chosen = jump > 9 ? last + Math.sign(pitch - last) * (3 + Math.floor(rand() * 3)) : pitch;
    const dur = rand() < 0.2 ? stepSec * 2 : stepSec * (0.8 + rand() * 0.4);
    notes.push({
      pitch: Math.max(48, Math.min(84, chosen)),
      start: t,
      duration: dur,
      velocity: 0.55 + rand() * 0.35,
    });
    last = chosen;
    t += stepSec;
  }
  return notes;
}

const OSCILLATORS: PresetGlance["oscillator"][] = [
  "sine",
  "triangle",
  "sawtooth",
  "square",
  "fmsine",
  "amsine",
];

function buildPreset(rand: () => number, mood: string): PresetGlance {
  const warm = mood === "Dreamy" || mood === "Mellow";
  const bright = mood === "Uplifting" || mood === "Intense";
  return {
    oscillator: OSCILLATORS[Math.floor(rand() * OSCILLATORS.length)],
    attack: warm ? 0.1 + rand() * 0.6 : 0.005 + rand() * 0.08,
    decay: 0.1 + rand() * 0.6,
    sustain: 0.3 + rand() * 0.6,
    release: warm ? 0.8 + rand() * 1.8 : 0.2 + rand() * 1.0,
    filterCutoff: bright ? 2200 + rand() * 5000 : 600 + rand() * 2200,
    filterResonance: rand() * 0.8,
  };
}

export type GenerationType = "Audio Sample" | "MIDI Melody" | "VST Preset";

interface GenerateOptions {
  prompt: string;
  mode: "lite" | "pro";
  type: GenerationType;
  model: string;
  format: string;
  count?: number;
}

/**
 * Produce a deterministic set of preview results for the given prompt. The
 * same prompt + settings always yield the same list so typing feels stable.
 */
export function generateFromPrompt({
  prompt,
  mode,
  type,
  model,
  format,
  count = 3,
}: GenerateOptions): AudioResult[] {
  const trimmed = prompt.trim();
  if (trimmed.length < 3) return [];

  const base = hash(`${mode}|${type}|${model}|${format}|${trimmed.toLowerCase()}`);
  const genre = pickBy(GENRES, trimmed, GENRES[0]);
  const mood = pickBy(MOODS, trimmed, MOODS[4]);

  const results: AudioResult[] = [];
  for (let i = 0; i < count; i++) {
    const rand = mulberry32(base + i * 2654435761);
    const id = `gen-${base.toString(36)}-${i}`;
    const kind: ResultKind = type === "Audio Sample" ? "audio" : type === "MIDI Melody" ? "midi" : "preset";
    const common = {
      id,
      title: title(trimmed, genre.name, mood.name, i),
      model,
      kind,
      durationSeconds: kind === "preset" ? 4 : 6,
      format,
      description: `${mood.name} ${genre.name.toLowerCase()} idea from "${trimmed.slice(0, 48)}${trimmed.length > 48 ? "…" : ""}"`,
      tags: [genre.name.toLowerCase(), mood.name.toLowerCase()],
    };

    if (kind === "audio") {
      results.push({
        ...common,
        audioSeed: base + i,
        waveformHue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]",
      });
    } else if (kind === "midi") {
      const root = 57 + Math.floor(rand() * 5); // ~A3..D4
      results.push({
        ...common,
        notes: buildMelody(rand, genre.scale, root, 2),
      });
    } else {
      results.push({
        ...common,
        preset: buildPreset(rand, mood.name),
      });
    }
  }
  return results;
}

// --- Ideas -----------------------------------------------------------------

export interface PromptIdea {
  id: string;
  text: string;
  category: "Lo-fi" | "Ambient" | "Pop" | "House" | "Trap" | "Synthwave" | "Jazz" | "Cinematic";
}

export const PROMPT_IDEAS: PromptIdea[] = [
  { id: "i1", text: "Dusty lo-fi beat with warm Rhodes chords and soft brush drums at 82 BPM", category: "Lo-fi" },
  { id: "i2", text: "Cinematic ambient pad with slow attack, shimmer reverb and evolving texture", category: "Cinematic" },
  { id: "i3", text: "Bright summer pop loop with plucky synths, clap and sidechained bass", category: "Pop" },
  { id: "i4", text: "Deep house groove in A minor, filtered pad, four-on-the-floor kick, 124 BPM", category: "House" },
  { id: "i5", text: "Dark trap melody with haunting piano, 808 slides and hi-hat rolls at 140 BPM", category: "Trap" },
  { id: "i6", text: "80s synthwave arpeggio with analog saw, gated reverb snare and neon glow", category: "Synthwave" },
  { id: "i7", text: "Smooth jazz piano motif in D minor, swung eighths, upright bass walking line", category: "Jazz" },
  { id: "i8", text: "Melancholic lo-fi melody, vinyl crackle, muted trumpet, rainy afternoon mood", category: "Lo-fi" },
  { id: "i9", text: "Ethereal ambient bed, sparse MIDI melody, long release, dreamy and warm", category: "Ambient" },
  { id: "i10", text: "Uplifting pop topline with layered vocals, punchy drums, bright pluck lead", category: "Pop" },
  { id: "i11", text: "Tech house percussion loop with rolling bassline, shaker and vocal chops", category: "House" },
  { id: "i12", text: "Hybrid cinematic trailer hit, thunderous sub drop, ethereal choir swell", category: "Cinematic" },
];

export function randomIdeas(count = 5): PromptIdea[] {
  const shuffled = [...PROMPT_IDEAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
