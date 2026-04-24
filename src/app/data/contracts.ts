export type AudioType = "Audio Sample" | "MIDI Melody" | "VST Preset";
export type ModelName =
  | "ACE-STEP"
  | "Diffusion"
  | "MidiCraft"
  | "Mus Meta"
  | "SoundCraft"
  | "SoundCraft v1"
  | "SoundCraft v1.5"
  | "VSTCraft";
export type OutputFormat =
  | "FLAC"
  | "Logic Pro (.aupreset)"
  | "MIDI"
  | "MP3"
  | "OGG"
  | "Serum (.fxp)"
  | "VST Bank (.fxb)"
  | "VST2 (.fxp)"
  | "VST3 (.vstpreset)"
  | "Vital (.vital)"
  | "WAV"
  | "Ableton Rack (.adv)"
  | "Massive (.nmsv)";

export type ResultKind = "audio" | "midi" | "preset";

export interface MidiNoteLite {
  pitch: number;
  start: number;
  duration: number;
  velocity?: number;
}

export interface PresetGlance {
  oscillator: "sine" | "triangle" | "sawtooth" | "square" | "fmsine" | "amsine";
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number;
  filterResonance: number;
}

export interface DemoAssetMetadata {
  assetId: string;
  assetUrl?: string;
  previewUrl?: string | null;
  relativePath?: string | null;
  absolutePath?: string | null;
  hashSha1?: string | null;
  matchedToSource?: boolean;
  sourceRelativePath?: string | null;
  sourceAbsolutePath?: string | null;
  sourceHashSha1?: string | null;
  analysisSource?: string | null;
  durationSeconds?: number | null;
  estimatedTempo?: number | null;
  keyHints?: string[];
  keySignatureHint?: string | null;
  tempoMapBpm?: number[];
  genreTags?: string[];
  moodTags?: string[];
  noteCount?: number | null;
  trackCount?: number | null;
  sampleRate?: number | null;
  channels?: number | null;
  soundType?: string | null;
  source?: string | null;
  bpm?: number | null;
  key?: string | null;
  genre?: string | null;
  mood?: string | null;
  format?: string | null;
  promptHints?: string[];
  generatedFrom?: string;
}

export interface AudioResult {
  id: string;
  title: string;
  model: string;
  kind: ResultKind;
  durationSeconds: number;
  format: string;
  description: string;
  tags: string[];
  audioSeed?: number;
  notes?: MidiNoteLite[];
  preset?: PresetGlance;
  waveformHue?: string;
  metadata?: DemoAssetMetadata;
}

export interface LibraryAsset {
  id: string;
  title: string;
  kind: ResultKind;
  format: string;
  duration?: string;
  durationSeconds: number;
  tags: string[];
  createdAt: string;
  audioSeed?: number;
  notes?: MidiNoteLite[];
  preset?: PresetGlance;
  waveformHue?: string;
  metadata?: DemoAssetMetadata;
}

export interface DemoGenerationTemplate {
  id: string;
  title: string;
  kind: ResultKind;
  model: string;
  format: string;
  durationSeconds: number;
  tags: string[];
  promptHints: string[];
  audioSeed?: number;
  notes?: MidiNoteLite[];
  preset?: PresetGlance;
  waveformHue?: string;
  description?: string;
  metadata?: DemoAssetMetadata;
}
