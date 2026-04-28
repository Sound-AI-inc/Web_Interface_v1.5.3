import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPreviewProps {
  seed?: number;
  audioUrl?: string;
  durationSeconds: number;
  className?: string;
}

const PRIMARY = "rgb(var(--color-primary))";
const PRIMARY_SOFT = "rgb(var(--color-primary-soft))";

/**
 * Plays real demo assets when a preview URL is available. If not, it falls back
 * to a deterministic synthesized loop so audio result cards still feel alive
 * before the full backend media pipeline is connected.
 */
export default function AudioPreview({
  seed = 1,
  audioUrl,
  durationSeconds,
  className = "",
}: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  const peaks = useMemo(() => synthesizePeaks(seed, 96, durationSeconds), [seed, durationSeconds]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barW = Math.max(2, w / peaks.length - 2);
    const gap = 2;
    const step = (w - (peaks.length - 1) * gap) / peaks.length;

    peaks.forEach((peak, index) => {
      const x = index * (step + gap);
      const barH = Math.max(2, peak * h * 0.9);
      const y = (h - barH) / 2;
      const played = x / w <= progressRef.current;
      ctx.fillStyle = played ? PRIMARY : PRIMARY_SOFT;
      ctx.fillRect(x, y, barW, barH);
    });
  }, [peaks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      drawWaveform();
    };

    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(container);
    return () => obs.disconnect();
  }, [drawWaveform]);

  useEffect(() => {
    progressRef.current = progress;
    drawWaveform();
  }, [drawWaveform, progress]);

  const stopPlayback = useCallback(() => {
    const src = sourceRef.current;
    if (src) {
      try {
        src.onended = null;
        src.stop();
      } catch {
        // ignore
      }
      sourceRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.pause();
      audio.currentTime = 0;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      ctxRef.current?.close().catch(() => undefined);
    };
  }, [stopPlayback]);

  useEffect(() => {
    stopPlayback();
    setPlaying(false);
    setProgress(0);
    bufferRef.current = null;
    audioRef.current = null;
  }, [audioUrl, durationSeconds, seed, stopPlayback]);

  const ensureBuffer = async (ctx: AudioContext) => {
    if (bufferRef.current) return bufferRef.current;
    const buffer = synthesizeBuffer(ctx, seed, durationSeconds);
    bufferRef.current = buffer;
    return buffer;
  };

  const tickPlayback = () => {
    const audio = audioRef.current;
    if (audio) {
      const safeDuration = audio.duration || durationSeconds || 1;
      setProgress(Math.min(1, Math.max(0, audio.currentTime / safeDuration)));
      if (!audio.paused) {
        rafRef.current = requestAnimationFrame(tickPlayback);
      }
      return;
    }

    if (!sourceRef.current || !ctxRef.current) return;
    const t = (ctxRef.current.currentTime - startedAtRef.current) / durationSeconds;
    setProgress(Math.min(1, Math.max(0, t)));
    rafRef.current = requestAnimationFrame(tickPlayback);
  };

  const toggle = async () => {
    if (playing) {
      stopPlayback();
      setPlaying(false);
      setProgress(0);
      return;
    }

    if (audioUrl) {
      try {
        const absoluteUrl = new URL(audioUrl, window.location.href).href;
        let audio = audioRef.current;
        if (!audio || audio.src !== absoluteUrl) {
          audio = new Audio(absoluteUrl);
          audio.preload = "auto";
          audioRef.current = audio;
        }

        audio.currentTime = 0;
        audio.onended = () => {
          setPlaying(false);
          setProgress(0);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        };

        await audio.play();
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tickPlayback);
        return;
      } catch {
        audioRef.current = null;
      }
    }

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }

    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    const buffer = await ensureBuffer(ctx);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      setPlaying(false);
      setProgress(0);
      sourceRef.current = null;
    };
    sourceRef.current = src;
    startedAtRef.current = ctx.currentTime;
    src.start();
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tickPlayback);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="app-btn-primary h-10 w-10 shrink-0 !px-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div
        ref={containerRef}
        className="relative h-14 flex-1 overflow-hidden rounded-input bg-surface-muted"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

function synthesizePeaks(seed: number, count: number, duration: number): number[] {
  const peaks: number[] = [];
  const base = 0.2 + ((seed * 17) % 30) / 100;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const env = Math.sin(Math.PI * t) ** 0.6;
    const osc =
      Math.sin((seed + 1) * t * 11) * 0.5 +
      Math.sin((seed + 3) * t * 23 + 1.2) * 0.35 +
      Math.sin((seed + 5) * t * 41 + 2.1) * 0.2;
    const rnd = pseudoRandom(seed + i) - 0.5;
    peaks.push(Math.min(1, Math.max(0.1, base + env * Math.abs(osc) + rnd * 0.12)));
  }
  const spread = Math.min(1, duration / 20);
  return peaks.map((peak) => peak * (0.7 + spread * 0.3));
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function synthesizeBuffer(ctx: AudioContext, seed: number, durationSeconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * Math.min(durationSeconds, 12));
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const baseFreq = 72 + (seed * 19) % 96;
  const harmonicFreq = baseFreq * (1.5 + ((seed * 7) % 5) * 0.12);
  const airFreq = baseFreq * (2.4 + ((seed * 11) % 7) * 0.08);
  const tempo = 82 + (seed % 6) * 11;
  const beatLength = 60 / tempo;
  const stepLength = beatLength / 2;

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let noiseState = (seed * 9301 + channel * 49297 + 233280) >>> 0;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const arc = Math.sin((Math.PI * i) / length) ** 0.72;
      const detune = channel === 0 ? 0.997 : 1.003;
      const stepPhase = (t % stepLength) / stepLength;
      const beatPhase = (t % beatLength) / beatLength;
      const gate = 0.35 + Math.exp(-stepPhase * (7 + (seed % 4))) * 0.95;
      const kickEnv = Math.exp(-beatPhase * 11);
      const slowDrift = 0.72 + 0.28 * Math.sin(2 * Math.PI * 0.17 * t + channel * 0.9);

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const noise = (noiseState / 4294967296 - 0.5) * 2;

      const sub =
        Math.sin(2 * Math.PI * baseFreq * detune * t) * 0.24 +
        Math.sin(2 * Math.PI * (baseFreq * 0.5) * detune * t) * 0.12;
      const body =
        Math.sin(2 * Math.PI * harmonicFreq * detune * t + 0.4) * 0.2 +
        Math.sin(2 * Math.PI * airFreq * detune * t + 1.1) * 0.08;
      const transient = noise * 0.11 * Math.exp(-stepPhase * 18);
      const kick = Math.sin(2 * Math.PI * (42 + kickEnv * 54) * t) * kickEnv * 0.18;
      const shimmer = Math.sin(2 * Math.PI * (airFreq * 1.7) * detune * t + 1.8) * 0.04 * slowDrift;

      const sample =
        (sub * (0.62 + gate * 0.18) + body * gate + transient + kick + shimmer) * arc * 0.82;

      data[i] = Math.tanh(sample * 1.45) * 0.78;
    }
  }

  return buffer;
}
