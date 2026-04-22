import * as Tone from "tone";

/**
 * Shared Salamander grand piano sampler loaded from Tone.js's public CDN.
 * Loaded lazily on first access to avoid blocking initial render.
 */
let _sampler: Tone.Sampler | null = null;
let _loadPromise: Promise<Tone.Sampler> | null = null;

export function getPianoSampler(): Promise<Tone.Sampler> {
  if (_sampler) return Promise.resolve(_sampler);
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((resolve) => {
    const sampler = new Tone.Sampler({
      urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
        A3: "A3.mp3",
        A4: "A4.mp3",
        A5: "A5.mp3",
        A6: "A6.mp3",
        C2: "C2.mp3",
        C3: "C3.mp3",
        C4: "C4.mp3",
        C5: "C5.mp3",
        C6: "C6.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        _sampler = sampler;
        resolve(sampler);
      },
    }).toDestination();
  });
  return _loadPromise;
}

export function midiToNoteName(pitch: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(pitch / 12) - 1;
  const name = names[pitch % 12];
  return `${name}${octave}`;
}
