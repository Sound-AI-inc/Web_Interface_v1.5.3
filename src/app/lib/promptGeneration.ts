import type { AudioResult, MidiNoteLite, PresetGlance, ResultKind } from "../data/mock";
import type { DemoGenerationTemplate } from "../data/contracts";
import { generatedGenerationTemplates } from "../data/demo-library.generated";

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
  category: "Lo-fi" | "Ambient" | "Pop" | "House" | "Trap" | "Synthwave" | "Jazz" | "Cinematic" | "Rock" | "Other" | "All" | "Country" | "Classical" | "Hip-hop" | "Electronic";
  type: GenerationType;
}

export const PROMPT_IDEAS: PromptIdea[] = [
  { id: "i1", text: "Dusty lo-fi beat with warm Rhodes chords and soft brush drums at 82 BPM", category: "Lo-fi", type: "Audio Sample" },
  { id: "i2", text: "Cinematic ambient pad with slow attack, shimmer reverb and evolving texture", category: "Cinematic", type: "Audio Sample" },
  { id: "i3", text: "Bright summer pop loop with plucky synths, clap and sidechained bass", category: "Pop", type: "Audio Sample" },
  { id: "i4", text: "Deep house groove in A minor, filtered pad, four-on-the-floor kick, 124 BPM", category: "House", type: "Audio Sample" },
  { id: "i5", text: "Dark trap melody with haunting piano, 808 slides and hi-hat rolls at 140 BPM", category: "Trap", type: "Audio Sample" },
  { id: "i6", text: "80s synthwave arpeggio with analog saw, gated reverb snare and neon glow", category: "Synthwave", type: "Audio Sample" },
  { id: "i7", text: "Smooth jazz piano motif in D minor, swung eighths, upright bass walking line", category: "Jazz", type: "Audio Sample" },
  { id: "i8", text: "Melancholic lo-fi melody, vinyl crackle, muted trumpet, rainy afternoon mood", category: "Lo-fi", type: "Audio Sample" },
  { id: "i9", text: "Ethereal ambient bed, sparse MIDI melody, long release, dreamy and warm", category: "Ambient", type: "Audio Sample" },
  { id: "i10", text: "Uplifting pop topline with layered vocals, punchy drums, bright pluck lead", category: "Pop", type: "Audio Sample" },
  { id: "i11", text: "Tech house percussion loop with rolling bassline, shaker and vocal chops", category: "House", type: "Audio Sample" },
  { id: "i12", text: "Hybrid cinematic trailer hit, thunderous sub drop, ethereal choir swell", category: "Cinematic", type: "Audio Sample" },
  { id: "i13", text: "Aggressive trap beat with distorted 808s, snappy snares, dark piano riff", category: "Trap", type: "Audio Sample" },
  { id: "i14", text: "Retro synthwave bassline with punchy envelope, sidechain compression, 100 BPM", category: "Synthwave", type: "Audio Sample" },
  { id: "i15", text: "Mellow jazz guitar progression in G major, soft brush drums, late night vibe", category: "Jazz", type: "Audio Sample" },
  { id: "i16", text: "Groovy lo-fi drum loop with jazzy chords, vinyl crackle, chill evening mood", category: "Lo-fi", type: "Audio Sample" },
  { id: "i17", text: "Dark ambient drone with evolving texture, minimal MIDI, cold and moody atmosphere", category: "Ambient", type: "Audio Sample" },
  { id: "i18", text: "Bright pop chord progression with acoustic guitar, tambourine, sunny and uplifting feel", category: "Pop", type: "Audio Sample" },
  { id: "i19", text: "Funky house rhythm with syncopated bassline, cowbell, and soulful vocal sample", category: "House", type: "Audio Sample" },
  { id: "i20", text: "Intense cinematic percussion loop with aggressive hits, rising tension, perfect for action scenes", category: "Cinematic", type: "Audio Sample" },  
  { id: "i21", text: "Hard-hitting trap drum pattern with rolling hi-hats, booming 808s, and a dark, menacing vibe", category: "Trap", type: "Audio Sample" },
  { id: "i22", text: "Neon-lit synthwave lead with a catchy arpeggio, lush chorus effect, and a driving rhythm at 100 BPM", category: "Synthwave", type: "Audio Sample" },
  { id: "i23", text: "Smooth jazz saxophone melody in E minor, accompanied by a walking bassline and soft brush drums, evoking a late-night city atmosphere", category: "Jazz", type: "Audio Sample" },
  { id: "i24", text: "Chill lo-fi hip-hop beat with a laid-back groove, warm Rhodes chords, and a nostalgic vibe, perfect for studying or relaxing", category: "Lo-fi", type: "Audio Sample" },
  { id: "i25", text: "Ethereal ambient soundscape with evolving pads, sparse MIDI melody, and a dreamy, otherworldly atmosphere, ideal for meditation or introspection", category: "Ambient", type: "Audio Sample" },
  { id: "i26", text: "Uplifting pop anthem with a catchy vocal hook, bright synths, and an energetic rhythm, perfect for summer playlists and feel-good moments", category: "Pop", type: "MIDI Melody" },
  { id: "i27", text: "Groovy house bassline with a syncopated rhythm, punchy envelope, and a deep, infectious groove that gets people moving on the dancefloor", category: "House", type: "MIDI Melody" },
  { id: "i28", text: "Cinematic orchestral hit with a powerful brass section, dramatic percussion, and a rising tension that builds anticipation for epic moments in film or trailers", category: "Cinematic", type: "MIDI Melody" },
  { id: "i29", text: "Dark trap melody with a haunting piano riff, eerie synths, and a menacing atmosphere that sets the tone for intense hip-hop tracks", category: "Trap", type: "MIDI Melody" },
  { id: "i30", text: "Retro synthwave arpeggio with a catchy pattern, lush chorus effect, and a driving rhythm at 100 BPM, evoking the nostalgic vibes of the 80s", category: "Synthwave", type: "MIDI Melody" },
  { id: "i31", text: "Smooth jazz chord progression in B flat major, accompanied by a walking bassline and soft brush drums, creating a relaxed and sophisticated atmosphere", category: "Jazz", type: "MIDI Melody" },
  { id: "i32", text: "Warm and dusty lo-fi chord progression with a laid-back groove, perfect for creating a nostalgic and cozy atmosphere in your tracks", category: "Lo-fi", type: "VST Preset" },
  { id: "i33", text: "Ethereal ambient pad preset with a slow attack, long release, and evolving texture, ideal for creating dreamy soundscapes and atmospheric layers in your productions", category: "Ambient", type: "VST Preset" },
  { id: "i34", text: "Bright pop synth preset with a punchy envelope, shimmering chorus effect, and a catchy lead sound that cuts through the mix, perfect for adding energy and excitement to your pop productions", category: "Pop", type: "VST Preset" },
  { id: "i35", text: "Deep house bass preset with a syncopated rhythm, punchy envelope, and a rich, warm tone that provides a solid foundation for your house tracks", category: "House", type: "VST Preset" },
  { id: "i36", text: "Cinematic brass preset with a powerful and bold sound, perfect for creating epic and dramatic moments in your film scores or trailer music", category: "Cinematic", type: "VST Preset" },
  { id: "i37", text: "Dark trap lead preset with a menacing tone, aggressive envelope, and eerie modulation effects, ideal for adding intensity and edge to your trap productions", category: "Trap", type: "VST Preset" },
  { id: "i38", text: "Retro synthwave pad preset with a lush and nostalgic sound, featuring a slow attack, long release, and rich chorus effect that evokes the iconic vibes of the 80s", category: "Synthwave", type: "VST Preset" },
  { id: "i39", text: "Smooth jazz electric piano preset with a warm and mellow tone, perfect for creating laid-back grooves and sophisticated chord progressions in your jazz productions", category: "Jazz", type: "VST Preset" },
  { id: "i40", text: "Groovy lo-fi drum kit preset with a collection of dusty kicks, snappy snares, and crunchy hi-hats, ideal for adding a vintage and nostalgic vibe to your lo-fi hip-hop tracks", category: "Lo-fi", type: "VST Preset" },
  { id: "i41", text: "Ethereal ambient texture preset with evolving pads, shimmering effects, and a dreamy atmosphere, perfect for creating otherworldly soundscapes and adding depth to your ambient productions", category: "Ambient", type: "VST Preset" },
  { id: "i42", text: "Bright pop vocal chop preset with a catchy and energetic sound, featuring a punchy envelope and vibrant modulation effects that add excitement and movement to your pop tracks", category: "Pop", type: "VST Preset" },
];

function ideasForType(type: GenerationType, count = 5): PromptIdea[] {
  const pool = PROMPT_IDEAS.filter((idea) => idea.type === type);
  const source = pool.length > 0 ? pool : PROMPT_IDEAS;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomIdeas(typeOrCount?: GenerationType | number, count = 5): PromptIdea[] {
  if (typeof typeOrCount === "number") {
    return ideasForType("Audio Sample", typeOrCount);
  }
  if (typeof typeOrCount === "string") {
    return ideasForType(typeOrCount, count);
  }
  return ideasForType("Audio Sample", count);
}

export function matchGenerationTemplates(type: GenerationType, prompt: string): DemoGenerationTemplate[] {
  const kind: ResultKind =
    type === "Audio Sample" ? "audio" : type === "MIDI Melody" ? "midi" : "preset";
  const normalized = prompt.trim().toLowerCase();
  const scored = generatedGenerationTemplates
    .filter((template) => template.kind === kind)
    .map((template) => ({
      template,
      score: template.promptHints.reduce(
        (sum, hint) => sum + (normalized.includes(hint.toLowerCase()) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.template);
}
