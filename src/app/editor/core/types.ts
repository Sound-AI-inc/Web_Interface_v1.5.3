export type EditorTab = "audio" | "midi" | "synth";

export interface AudioRegion {
  start: number; // seconds
  end: number; // seconds
}

export interface MidiNote {
  id: string;
  /** MIDI pitch number (0–127). 60 = C4. */
  pitch: number;
  /** Start time in seconds. */
  start: number;
  /** Duration in seconds. */
  duration: number;
  /** 0..1 */
  velocity: number;
}

export interface SynthParams {
  attack: number; // seconds
  decay: number;
  sustain: number; // 0..1
  release: number;
  filterCutoff: number; // Hz
  filterResonance: number; // Q
  lfoRate: number; // Hz
  lfoDepth: number; // 0..1
}

export interface EffectsParams {
  reverbEnabled: boolean;
  reverbWet: number; // 0..1
  delayEnabled: boolean;
  delayTime: number; // seconds
  delayFeedback: number; // 0..1
  chorusEnabled: boolean;
  chorusDepth: number; // 0..1
  compressorEnabled: boolean;
  compressorThreshold: number; // dB
  eqEnabled: boolean;
  eqLow: number; // dB
  eqMid: number; // dB
  eqHigh: number; // dB
}

export const defaultSynth: SynthParams = {
  attack: 0.02,
  decay: 0.15,
  sustain: 0.6,
  release: 0.4,
  filterCutoff: 1200,
  filterResonance: 1,
  lfoRate: 4,
  lfoDepth: 0,
};

export const defaultEffects: EffectsParams = {
  reverbEnabled: false,
  reverbWet: 0.3,
  delayEnabled: false,
  delayTime: 0.25,
  delayFeedback: 0.3,
  chorusEnabled: false,
  chorusDepth: 0.5,
  compressorEnabled: false,
  compressorThreshold: -18,
  eqEnabled: false,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
};
