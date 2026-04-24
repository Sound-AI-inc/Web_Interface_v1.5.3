import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPreviewProps {
  seed?: number;
  durationSeconds: number;
  className?: string;
}

const PRIMARY = "rgb(var(--color-primary))";
const PRIMARY_SOFT = "rgb(var(--color-primary-soft))";

/**
 * Synthesizes a short deterministic audio snippet from a seed and renders a
 * playable waveform. Used for audio-type result cards (samples) until real
 * backend assets are wired up via Supabase storage.
 */
export default function AudioPreview({ seed = 1, durationSeconds, className = "" }: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
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

    peaks.forEach((p, i) => {
      const x = i * (step + gap);
      const barH = Math.max(2, p * h * 0.9);
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

  useEffect(() => {
    return () => {
      stopSource();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close().catch(() => undefined);
    };
  }, []);

  const stopSource = () => {
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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const ensureBuffer = async (ctx: AudioContext) => {
    if (bufferRef.current) return bufferRef.current;
    const buf = synthesizeBuffer(ctx, seed, durationSeconds);
    bufferRef.current = buf;
    return buf;
  };

  const toggle = async () => {
    if (playing) {
      stopSource();
      setPlaying(false);
      setProgress(0);
      return;
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
    const tick = () => {
      if (!sourceRef.current || !ctxRef.current) return;
      const t = (ctxRef.current.currentTime - startedAtRef.current) / durationSeconds;
      setProgress(Math.min(1, Math.max(0, t)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
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
    const env = Math.sin(Math.PI * t) ** 0.6; // arch envelope
    const osc =
      Math.sin((seed + 1) * t * 11) * 0.5 +
      Math.sin((seed + 3) * t * 23 + 1.2) * 0.35 +
      Math.sin((seed + 5) * t * 41 + 2.1) * 0.2;
    const rnd = pseudoRandom(seed + i) - 0.5;
    peaks.push(Math.min(1, Math.max(0.1, base + env * Math.abs(osc) + rnd * 0.12)));
  }
  // Slight deterministic variation by duration so 30s vs 5s reads differently.
  const spread = Math.min(1, duration / 20);
  return peaks.map((p) => p * (0.7 + spread * 0.3));
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function synthesizeBuffer(ctx: AudioContext, seed: number, durationSeconds: number): AudioBuffer {
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
