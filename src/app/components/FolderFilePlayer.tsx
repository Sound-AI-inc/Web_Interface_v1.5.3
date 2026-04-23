import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { LibraryAsset } from "../data/mock";
import { getPianoSampler } from "../lib/pianoSampler";
import * as Tone from "tone";

interface FolderFilePlayerProps {
  asset: LibraryAsset;
}

/**
 * Ultra-compact player used inside Library folder rows. Supports all three
 * asset kinds (audio / midi / preset) through lightweight inline playback —
 * no waveform rendering, just a play/pause pill + title + format meta.
 */
export default function FolderFilePlayer({ asset }: FolderFilePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const scheduledIds = useRef<number[]>([]);

  useEffect(() => {
    return () => stopAll();
  }, []);

  const stopAll = () => {
    try {
      sourceRef.current?.stop();
    } catch {
      // ignore
    }
    sourceRef.current = null;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    const transport = Tone.getTransport();
    scheduledIds.current.forEach((id) => transport.clear(id));
    scheduledIds.current = [];
    transport.stop();
    transport.position = 0;
    setPlaying(false);
  };

  const playAudio = async () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = synthesizeBuffer(ctx, asset.audioSeed ?? 1, asset.durationSeconds);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      sourceRef.current = null;
      setPlaying(false);
    };
    sourceRef.current = src;
    src.start();
    setPlaying(true);
    timeoutRef.current = window.setTimeout(
      () => setPlaying(false),
      Math.min(asset.durationSeconds, 12) * 1000,
    );
  };

  const playMidi = async () => {
    if (!asset.notes || asset.notes.length === 0) return;
    await Tone.start();
    const sampler = await getPianoSampler();
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    scheduledIds.current.forEach((id) => transport.clear(id));
    scheduledIds.current = [];
    for (const note of asset.notes) {
      const id = transport.schedule((time) => {
        sampler.triggerAttackRelease(
          Tone.Frequency(note.pitch, "midi").toNote(),
          Math.max(0.1, note.duration),
          time,
          Math.max(0.2, Math.min(1, note.velocity ?? 0.8)),
        );
      }, note.start);
      scheduledIds.current.push(id);
    }
    setPlaying(true);
    transport.start();
    const dur =
      Math.max(
        ...asset.notes.map((n) => n.start + n.duration),
        asset.durationSeconds,
      ) + 0.4;
    timeoutRef.current = window.setTimeout(() => {
      stopAll();
    }, dur * 1000);
  };

  const playPreset = async () => {
    await Tone.start();
    const synth = new Tone.MonoSynth({
      envelope: {
        attack: asset.preset?.attack ?? 0.05,
        decay: asset.preset?.decay ?? 0.2,
        sustain: asset.preset?.sustain ?? 0.7,
        release: asset.preset?.release ?? 0.4,
      },
      filter: { Q: asset.preset?.filterResonance ?? 1 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.5,
        release: 0.4,
        baseFrequency: asset.preset?.filterCutoff ?? 800,
        octaves: 2,
      },
    }).toDestination();
    setPlaying(true);
    const now = Tone.now();
    const notes = ["C3", "E3", "G3", "C4"];
    notes.forEach((n, i) => {
      synth.triggerAttackRelease(n, 0.3, now + i * 0.18);
    });
    timeoutRef.current = window.setTimeout(() => {
      try {
        synth.dispose();
      } catch {
        // ignore
      }
      setPlaying(false);
    }, notes.length * 180 + 400);
  };

  const toggle = async () => {
    if (playing) {
      stopAll();
      return;
    }
    if (asset.kind === "audio") await playAudio();
    else if (asset.kind === "midi") await playMidi();
    else await playPreset();
  };

  return (
    <div className="flex items-center gap-2 rounded-button px-1.5 py-1 transition-colors hover:bg-surface-muted">
      <button
        type="button"
        onClick={toggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
          playing
            ? "bg-primary text-white"
            : "bg-surface text-text/70 hover:bg-primary/10 hover:text-primary"
        }`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate font-codec text-[11px] text-text/80">
          {asset.title}
        </div>
        <div className="truncate font-codec text-[9px] uppercase tracking-wider text-text/40">
          {asset.kind} · {asset.format}
        </div>
      </div>
    </div>
  );
}

function synthesizeBuffer(
  ctx: AudioContext,
  seed: number,
  durationSeconds: number,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * Math.min(durationSeconds, 12));
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const freqA = 120 + (seed * 37) % 180;
  const freqB = 180 + (seed * 61) % 260;
  const freqC = 240 + (seed * 97) % 400;
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.sin((Math.PI * i) / length) ** 0.8;
      const detune = ch === 0 ? 1 : 1.005;
      const sample =
        Math.sin(2 * Math.PI * freqA * detune * t) * 0.38 +
        Math.sin(2 * Math.PI * freqB * detune * t + 0.7) * 0.22 +
        Math.sin(2 * Math.PI * freqC * detune * t + 1.3) * 0.14;
      data[i] = sample * env * 0.6;
    }
  }
  return buffer;
}
