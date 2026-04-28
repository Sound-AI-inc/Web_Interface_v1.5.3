import {
  generatedGenerationTemplates,
  generatedLibraryAssets,
} from "../data/demo-library.generated";
import type {
  AudioResult,
  AudioType,
  DemoAssetMetadata,
  DemoGenerationTemplate,
  MidiNoteLite,
  PresetGlance,
  ResultKind,
} from "../data/contracts";

/**
 * Deterministic FNV-1a hash so identical prompts always produce identical
 * previews. This keeps demo generation stable without a backend round-trip.
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

const GENRES = [
  { key: ["lofi", "lo-fi", "chill"], name: "Lo-fi", scale: [0, 3, 5, 7, 10], tempo: 82 },
  { key: ["house", "techno", "edm", "club", "dance"], name: "House", scale: [0, 2, 3, 5, 7, 10], tempo: 124 },
  { key: ["trap", "hip hop", "hiphop", "rap"], name: "Trap", scale: [0, 2, 3, 5, 7, 8, 10], tempo: 140 },
  { key: ["ambient", "cinematic", "pad", "dream"], name: "Ambient", scale: [0, 2, 4, 7, 9], tempo: 70 },
  { key: ["jazz", "swing", "bossa"], name: "Jazz", scale: [0, 2, 3, 5, 7, 9, 10], tempo: 96 },
  { key: ["rock", "metal", "punk", "guitar"], name: "Rock", scale: [0, 2, 3, 5, 7, 8, 10], tempo: 120 },
  { key: ["pop", "upbeat", "happy", "bright"], name: "Pop", scale: [0, 2, 4, 5, 7, 9, 11], tempo: 110 },
  { key: ["synth", "retro", "80s", "vaporwave"], name: "Synthwave", scale: [0, 2, 3, 7, 8, 10], tempo: 100 },
] as const;

const MOODS = [
  { key: ["sad", "melancholic", "dark", "moody", "cold"], name: "Melancholic" },
  { key: ["happy", "bright", "uplifting", "summer"], name: "Uplifting" },
  { key: ["dreamy", "ethereal", "soft", "warm"], name: "Dreamy" },
  { key: ["aggressive", "intense", "hard", "heavy"], name: "Intense" },
  { key: ["mellow", "relaxed", "smooth", "groovy"], name: "Mellow" },
] as const;

const OSCILLATORS: PresetGlance["oscillator"][] = [
  "sine",
  "triangle",
  "sawtooth",
  "square",
  "fmsine",
  "amsine",
];

export type GenerationType = AudioType;

interface GenerateOptions {
  prompt: string;
  mode: "lite" | "pro";
  type: GenerationType;
  model: string;
  format: string;
  count?: number;
}

export interface PromptIdea {
  id: string;
  text: string;
  category: "Lo-fi" | "Ambient" | "Pop" | "House" | "Trap" | "Synthwave" | "Jazz" | "Cinematic";
  type: GenerationType;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function tokenize(text: string): string[] {
  const matches = normalize(text).match(/[a-zа-я0-9+#.-]{2,}/gi);
  return matches ?? [];
}

function kindFromType(type: GenerationType): ResultKind {
  if (type === "Audio Sample") return "audio";
  if (type === "MIDI Melody") return "midi";
  return "preset";
}

function pickBy<T extends { key: readonly string[] }>(buckets: readonly T[], prompt: string, fallback: T): T {
  const p = normalize(prompt);
  for (const bucket of buckets) {
    if (bucket.key.some((key) => p.includes(key))) return bucket;
  }
  return fallback;
}

function firstKeyword(prompt: string): string | null {
  const match = prompt.match(/[A-Za-zА-Яа-я]{3,}/);
  return match ? match[0] : null;
}

function title(prompt: string, template: DemoGenerationTemplate, variant: number): string {
  const keyword = firstKeyword(prompt);
  if (!keyword) return `${template.title} ${variant + 1}`;
  const cap = keyword[0].toUpperCase() + keyword.slice(1).toLowerCase();
  const suffixes = ["Loop", "Sketch", "Groove", "Idea", "Motif"];
  return `${cap} ${template.title.replace(/ Template$/i, "")} ${suffixes[variant % suffixes.length]}`;
}

function buildMelody(rand: () => number, scale: readonly number[], root: number, bars: number): MidiNoteLite[] {
  const notes: MidiNoteLite[] = [];
  const stepSeconds = 0.25;
  const totalSteps = Math.floor(bars * 16);
  let time = 0;
  let last = root;

  for (let i = 0; i < totalSteps; i++) {
    if (rand() < 0.18) {
      time += stepSeconds;
      continue;
    }

    const scaleStep = scale[Math.floor(rand() * scale.length)];
    const octaveOffset = (Math.floor(rand() * 3) - 1) * 12;
    const pitch = root + scaleStep + octaveOffset;
    const jump = Math.abs(pitch - last);
    const chosen = jump > 9 ? last + Math.sign(pitch - last) * (3 + Math.floor(rand() * 3)) : pitch;
    const duration = rand() < 0.2 ? stepSeconds * 2 : stepSeconds * (0.8 + rand() * 0.4);

    notes.push({
      pitch: Math.max(45, Math.min(84, chosen)),
      start: time,
      duration,
      velocity: 0.55 + rand() * 0.35,
    });

    last = chosen;
    time += stepSeconds;
  }

  return notes;
}

function varyNotes(seedNotes: MidiNoteLite[] | undefined, rand: () => number, fallbackScale: readonly number[]): MidiNoteLite[] {
  if (!seedNotes || seedNotes.length === 0) {
    const root = 57 + Math.floor(rand() * 5);
    return buildMelody(rand, fallbackScale, root, 2);
  }

  const transpose = Math.floor(rand() * 5) - 2;
  return seedNotes.map((note, index) => ({
    pitch: Math.max(36, Math.min(96, note.pitch + transpose + (index % 3 === 0 ? 0 : Math.floor(rand() * 3) - 1))),
    start: Number((note.start + (index % 2 === 0 ? 0 : rand() * 0.02)).toFixed(3)),
    duration: Number(Math.max(0.12, note.duration * (0.9 + rand() * 0.25)).toFixed(3)),
    velocity: Number(((note.velocity ?? 0.8) * (0.9 + rand() * 0.15)).toFixed(3)),
  }));
}

function buildPreset(rand: () => number, mood: string, seedPreset?: PresetGlance): PresetGlance {
  const warm = mood === "Dreamy" || mood === "Mellow";
  const bright = mood === "Uplifting" || mood === "Intense";

  if (seedPreset) {
    return {
      oscillator: seedPreset.oscillator,
      attack: Number((seedPreset.attack * (0.9 + rand() * 0.25)).toFixed(3)),
      decay: Number((seedPreset.decay * (0.9 + rand() * 0.25)).toFixed(3)),
      sustain: Number(Math.min(1, seedPreset.sustain * (0.92 + rand() * 0.12)).toFixed(3)),
      release: Number((seedPreset.release * (0.9 + rand() * 0.25)).toFixed(3)),
      filterCutoff: Math.round(seedPreset.filterCutoff * (0.88 + rand() * 0.3)),
      filterResonance: Number(Math.min(1, seedPreset.filterResonance * (0.9 + rand() * 0.2)).toFixed(3)),
    };
  }

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

function templateSearchTerms(template: DemoGenerationTemplate): string[] {
  const metadata = template.metadata;
  return [
    template.title,
    template.description,
    ...template.tags,
    ...template.promptHints,
    metadata?.genre,
    metadata?.mood,
    metadata?.key,
    metadata?.soundType,
    ...(metadata?.genreTags ?? []),
    ...(metadata?.moodTags ?? []),
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => tokenize(value));
}

function buildResultMetadata(
  template: DemoGenerationTemplate,
  genreName: string,
  moodName: string,
  kind: ResultKind,
  promptHints: string[],
): DemoAssetMetadata {
  return {
    assetId: template.metadata?.assetId ?? template.id,
    ...template.metadata,
    bpm: template.metadata?.bpm ?? GENRES.find((entry) => entry.name.toLowerCase() === genreName)?.tempo ?? 120,
    genre: template.metadata?.genre ?? genreName,
    mood: template.metadata?.mood ?? moodName,
    soundType: template.metadata?.soundType ?? kind,
    promptHints,
    generatedFrom: "metadata-demo",
  };
}

function templateScore(template: DemoGenerationTemplate, prompt: string): number {
  const promptTokens = tokenize(prompt);
  const terms = templateSearchTerms(template);
  if (promptTokens.length === 0 || terms.length === 0) return 0;

  let score = 0;
  for (const token of promptTokens) {
    if (terms.includes(token)) {
      score += token.length > 4 ? 3 : 2;
      continue;
    }
    if (terms.some((term) => term.includes(token) || token.includes(term))) {
      score += 1;
    }
  }

  return score;
}

export function matchGenerationTemplates(type: GenerationType, prompt: string): DemoGenerationTemplate[] {
  const kind = kindFromType(type);
  const pool = generatedGenerationTemplates.filter((template) => template.kind === kind);
  if (pool.length === 0) return [];

  const ranked = pool
    .map((template, index) => ({
      template,
      index,
      score: templateScore(template, prompt),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.index - right.index;
    })
    .map((entry) => entry.template);

  return ranked;
}

function formatPromptSummary(prompt: string): string {
  const trimmed = prompt.trim();
  return trimmed.length > 56 ? `${trimmed.slice(0, 56)}...` : trimmed;
}

function mergePromptHints(template: DemoGenerationTemplate, prompt: string): string[] {
  const promptTokens = tokenize(prompt);
  return Array.from(new Set([...template.promptHints, ...promptTokens])).slice(0, 12);
}

/**
 * Produce a deterministic set of preview results for the given prompt. The
 * same prompt + settings always yield the same list, but results are seeded
 * from metadata-generated templates instead of hardcoded-only mocks.
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

  const base = hash(`${mode}|${type}|${model}|${format}|${normalize(trimmed)}`);
  const genre = pickBy(GENRES, trimmed, GENRES[0]);
  const mood = pickBy(MOODS, trimmed, MOODS[4]);
  const rankedTemplates = matchGenerationTemplates(type, trimmed);
  const fallbackTemplate =
    rankedTemplates[0] ??
    generatedGenerationTemplates.find((template) => template.kind === kindFromType(type));

  if (!fallbackTemplate) return [];

  const results: AudioResult[] = [];
  for (let i = 0; i < count; i++) {
    const rand = mulberry32(base + i * 2654435761);
    const template = rankedTemplates[i % Math.max(rankedTemplates.length, 1)] ?? fallbackTemplate;
    const templateMetadata = template.metadata;
    const id = `gen-${base.toString(36)}-${i}`;
    const kind = kindFromType(type);
    const promptHints = mergePromptHints(template, trimmed);
    const metadata = buildResultMetadata(
      template,
      templateMetadata?.genre ?? genre.name.toLowerCase(),
      templateMetadata?.mood ?? mood.name.toLowerCase(),
      kind,
      promptHints,
    );
    const common: AudioResult = {
      id,
      title: title(trimmed, template, i),
      model,
      kind,
      durationSeconds: template.durationSeconds,
      format,
      description:
        `${mood.name} ${metadata.genre ?? genre.name.toLowerCase()} ${metadata.soundType ?? kind} ` +
        `from "${formatPromptSummary(trimmed)}"`,
      tags: Array.from(new Set([...template.tags, genre.name.toLowerCase(), mood.name.toLowerCase()])).slice(0, 6),
      metadata,
    };

    if (kind === "audio") {
      results.push({
        ...common,
        audioSeed: (template.audioSeed ?? 100) + i + (base % 1000),
        waveformHue: template.waveformHue ?? generatedLibraryAssets[0]?.waveformHue,
      });
      continue;
    }

    if (kind === "midi") {
      const notes = varyNotes(template.notes, rand, genre.scale);
      results.push({
        ...common,
        notes,
      });
      continue;
    }

    results.push({
      ...common,
      preset: buildPreset(rand, mood.name, template.preset),
    });
  }

  return results;
}

function categoryFromTemplate(template: DemoGenerationTemplate): PromptIdea["category"] {
  const key = normalize(template.metadata?.genre ?? template.tags[0] ?? template.title);
  if (key.includes("lofi")) return "Lo-fi";
  if (key.includes("cinematic")) return "Cinematic";
  if (key.includes("ambient")) return "Ambient";
  if (key.includes("house") || key.includes("techno")) return "House";
  if (key.includes("trap") || key.includes("hiphop")) return "Trap";
  if (key.includes("synth")) return "Synthwave";
  if (key.includes("jazz")) return "Jazz";
  return "Pop";
}

const TEMPLATE_IDEAS: PromptIdea[] = generatedGenerationTemplates.map((template) => ({
  id: `idea-${template.id}`,
  text:
    `${template.promptHints.slice(0, 4).join(", ")} ${template.metadata?.key ? `in ${template.metadata.key}` : ""}`.trim(),
  category: categoryFromTemplate(template),
  type: template.kind === "audio" ? "Audio Sample" : template.kind === "midi" ? "MIDI Melody" : "VST Preset",
}));

export const PROMPT_IDEAS: PromptIdea[] = [
  ...TEMPLATE_IDEAS,
  {
    id: "i1",
    text: "Dusty lo-fi beat with warm Rhodes chords and soft brush drums at 82 BPM",
    category: "Lo-fi",
    type: "Audio Sample",
  },
  {
    id: "i2",
    text: "Cinematic ambient pad with slow attack, shimmer reverb and evolving texture",
    category: "Cinematic",
    type: "Audio Sample",
  },
  {
    id: "i3",
    text: "Bright summer pop loop with plucky synths, clap and sidechained bass",
    category: "Pop",
    type: "Audio Sample",
  },
  {
    id: "i4",
    text: "Melancholic piano melody in A minor with sparse notes and rainy mood",
    category: "Lo-fi",
    type: "MIDI Melody",
  },
  {
    id: "i5",
    text: "Acid 303 bassline with syncopated movement, club energy and techno swing",
    category: "House",
    type: "MIDI Melody",
  },
  {
    id: "i6",
    text: "Warm Rhodes preset with soft attack, mellow sustain and vintage texture",
    category: "Jazz",
    type: "VST Preset",
  },
  {
    id: "i7",
    text: "Bright synthwave lead preset with analog edge, chorus and retro shine",
    category: "Synthwave",
    type: "VST Preset",
  },
];

export function ideasForType(type: GenerationType): PromptIdea[] {
  const filtered = PROMPT_IDEAS.filter((idea) => idea.type === type);
  return filtered.length > 0 ? filtered : PROMPT_IDEAS.filter((idea) => idea.type === "Audio Sample");
}

export function randomIdeas(type: GenerationType, count = 5): PromptIdea[] {
  const shuffled = [...ideasForType(type)].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function promptFromTemplate(template: DemoGenerationTemplate): string {
  const head = template.promptHints.slice(0, 4).join(", ");
  const key = template.metadata?.key ? ` in ${template.metadata.key}` : "";
  const bpm = template.metadata?.bpm ? ` at ${template.metadata.bpm} BPM` : "";
  return `${head}${key}${bpm}`.trim();
}

export function datasetPromptSuggestions(
  type: GenerationType,
  prompt: string,
  count = 4,
): string[] {
  const ranked = matchGenerationTemplates(type, prompt || type);
  if (ranked.length === 0) {
    return ideasForType(type)
      .slice(0, count)
      .map((idea) => idea.text);
  }

  return Array.from(new Set(ranked.map(promptFromTemplate))).slice(0, count);
}
