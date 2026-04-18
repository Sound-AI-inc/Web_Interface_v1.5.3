import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import type { MidiNote } from "../core/types";
import { downloadBlob } from "../audio/engine";

export const midiToNoteName = (pitch: number): string => {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(pitch / 12) - 1;
  return `${names[pitch % 12]}${octave}`;
};

export class MidiEngine {
  private synth: Tone.PolySynth | null = null;
  private parts: Tone.Part[] = [];
  private playing = false;

  async ensureStarted() {
    await Tone.start();
    if (!this.synth) {
      this.synth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.5 },
      }).toDestination();
    }
  }

  async play(notes: MidiNote[]) {
    await this.ensureStarted();
    this.stop();
    if (!this.synth || notes.length === 0) return;
    const synth = this.synth;
    const callback = (time: number, value: MidiNote) => {
      synth.triggerAttackRelease(
        midiToNoteName(value.pitch),
        value.duration,
        time,
        value.velocity,
      );
    };
    const events = notes.map((n) => ({ time: n.start, ...n }));
    const part = new Tone.Part(
      callback as unknown as (time: number, value: unknown) => void,
      events,
    );
    part.start(0);
    Tone.Transport.start();
    this.parts.push(part);
    this.playing = true;
  }

  stop() {
    this.parts.forEach((p) => {
      p.stop();
      p.dispose();
    });
    this.parts = [];
    if (this.playing) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      this.playing = false;
    }
  }

  dispose() {
    this.stop();
    this.synth?.dispose();
    this.synth = null;
  }
}

export function exportMidi(notes: MidiNote[], filename = "soundai-export.mid") {
  const midi = new Midi();
  const track = midi.addTrack();
  notes.forEach((n) => {
    track.addNote({
      midi: n.pitch,
      time: n.start,
      duration: n.duration,
      velocity: n.velocity,
    });
  });
  const blob = new Blob([midi.toArray()], { type: "audio/midi" });
  downloadBlob(blob, filename);
}

export async function parseMidiFile(file: File): Promise<MidiNote[]> {
  const buffer = await file.arrayBuffer();
  const midi = new Midi(buffer);
  const notes: MidiNote[] = [];
  midi.tracks.forEach((track) => {
    track.notes.forEach((n, i) => {
      notes.push({
        id: `${track.name ?? "t"}-${i}-${n.midi}-${n.ticks}`,
        pitch: n.midi,
        start: n.time,
        duration: n.duration,
        velocity: n.velocity,
      });
    });
  });
  return notes;
}

/** Snap all note starts to a grid of `gridSec` seconds. */
export function quantizeNotes(notes: MidiNote[], gridSec: number): MidiNote[] {
  if (gridSec <= 0) return notes;
  return notes.map((n) => ({
    ...n,
    start: Math.round(n.start / gridSec) * gridSec,
  }));
}

/** Transpose all notes by `semitones`. */
export function transposeNotes(notes: MidiNote[], semitones: number): MidiNote[] {
  return notes.map((n) => ({
    ...n,
    pitch: Math.max(0, Math.min(127, n.pitch + semitones)),
  }));
}
