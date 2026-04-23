import { create } from "zustand";
import {
  defaultEffects,
  defaultSynth,
  type EditorTab,
  type EffectsParams,
  type MidiNote,
  type SynthParams,
} from "./types";

interface HistoryEntry {
  buffer: AudioBuffer | null;
  notes: MidiNote[];
}

interface EditorState {
  tab: EditorTab;
  setTab: (t: EditorTab) => void;

  buffer: AudioBuffer | null;
  setBuffer: (b: AudioBuffer) => void;
  replaceBuffer: (b: AudioBuffer, label: string) => void;

  notes: MidiNote[];
  setNotes: (n: MidiNote[]) => void;
  replaceNotes: (n: MidiNote[], label: string) => void;

  selection: { start: number; end: number } | null;
  setSelection: (s: { start: number; end: number } | null) => void;

  synth: SynthParams;
  setSynth: (p: Partial<SynthParams>) => void;

  effects: EffectsParams;
  setEffects: (p: Partial<EffectsParams>) => void;

  // history
  past: HistoryEntry[];
  future: HistoryEntry[];
  undoLabel: string | null;
  redoLabel: string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  commit: (label: string) => void;

  // save state
  dirty: boolean;
  markSaved: () => void;
}

const defaultNotes: MidiNote[] = [
  { id: "n1", pitch: 60, start: 0, duration: 0.5, velocity: 0.8 },
  { id: "n2", pitch: 64, start: 0.5, duration: 0.5, velocity: 0.8 },
  { id: "n3", pitch: 67, start: 1.0, duration: 0.5, velocity: 0.8 },
  { id: "n4", pitch: 72, start: 1.5, duration: 1.0, velocity: 0.9 },
];

export const useEditor = create<EditorState>((set, get) => ({
  tab: "audio",
  setTab: (tab) => set({ tab }),

  buffer: null,
  setBuffer: (buffer) => set({ buffer }),
  replaceBuffer: (buffer, label) => {
    const s = get();
    set({
      past: [...s.past, { buffer: s.buffer, notes: s.notes }],
      future: [],
      buffer,
      dirty: true,
      undoLabel: label,
    });
  },

  notes: defaultNotes,
  setNotes: (notes) => set({ notes, dirty: true }),
  replaceNotes: (notes, label) => {
    const s = get();
    set({
      past: [...s.past, { buffer: s.buffer, notes: s.notes }],
      future: [],
      notes,
      dirty: true,
      undoLabel: label,
    });
  },

  selection: null,
  setSelection: (selection) => set({ selection }),

  synth: defaultSynth,
  setSynth: (p) => set((s) => ({ synth: { ...s.synth, ...p } })),

  effects: defaultEffects,
  setEffects: (p) => set((s) => ({ effects: { ...s.effects, ...p } })),

  past: [],
  future: [],
  undoLabel: null,
  redoLabel: null,
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    const current: HistoryEntry = { buffer: s.buffer, notes: s.notes };
    set({
      past: s.past.slice(0, -1),
      future: [current, ...s.future],
      buffer: prev.buffer,
      notes: prev.notes,
      dirty: true,
    });
  },
  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    const current: HistoryEntry = { buffer: s.buffer, notes: s.notes };
    set({
      past: [...s.past, current],
      future: s.future.slice(1),
      buffer: next.buffer,
      notes: next.notes,
      dirty: true,
    });
  },
  commit: (label) => {
    const s = get();
    set({
      past: [...s.past, { buffer: s.buffer, notes: s.notes }],
      future: [],
      undoLabel: label,
    });
  },

  dirty: false,
  markSaved: () => set({ dirty: false }),
}));
