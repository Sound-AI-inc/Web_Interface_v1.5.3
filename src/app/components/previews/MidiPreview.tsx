import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Pause } from "lucide-react";
import { useInterfaceMode } from "../../hooks/useInterfaceMode";
import { getPianoSampler, midiToNoteName } from "../../lib/pianoSampler";
import type { MidiNoteLite } from "../../data/mock";
import { usePreviewPlayback, usePreviewState } from "../../hooks/usePreviewPlayback";

interface MidiPreviewProps {
  notes: MidiNoteLite[];
  durationSeconds: number;
  className?: string;
  assetId?: string;
  inline?: boolean;
}

export default function MidiPreview({ notes, durationSeconds, className = "", assetId, inline = false }: MidiPreviewProps) {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";
  const noteActive = isPro ? "rgba(255,255,255,0.95)" : "rgb(var(--color-primary))";
  const noteIdle = isPro ? "rgba(255,255,255,0.35)" : "rgb(var(--color-primary-soft))";
  const gridStroke = isPro ? "rgba(255,255,255,0.08)" : "rgba(15,15,18,0.10)";
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const scheduledIds = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const { registerMidi, unregisterMidi } = usePreviewPlayback();
  const previewState = usePreviewState(assetId ?? "", "midi");
  const isGloballyControlled = assetId !== undefined;
  const playing = isGloballyControlled ? previewState.playing : localPlaying;
  const progress = isGloballyControlled ? previewState.progress : localProgress;
  const effectiveDuration = isGloballyControlled && previewState.duration > 0 ? previewState.duration : durationSeconds;

  useEffect(() => {
    if (assetId) {
      registerMidi(assetId, {
        play: async () => {
          setLoading(true);
          await toggle();
          setLoading(false);
        },
        pause: () => {
          if (isGloballyControlled || localPlaying) {
            stop();
            if (!isGloballyControlled) setLocalPlaying(false);
          }
        },
        stop: () => {
          stop();
          if (!isGloballyControlled) {
            setLocalPlaying(false);
            setLocalProgress(0);
          }
        },
        onProgress: (p) => {
          if (!isGloballyControlled) setLocalProgress(p);
        },
        onEnded: () => {
          stop();
          if (!isGloballyControlled) {
            setLocalPlaying(false);
            setLocalProgress(0);
          }
        },
        duration: effectiveDuration,
      });
    }
    return () => {
      if (assetId) unregisterMidi(assetId);
    };
  }, [assetId, registerMidi, unregisterMidi, effectiveDuration, isGloballyControlled, localPlaying]);

  const { minPitch, maxPitch } = useMemo(() => {
    if (notes.length === 0) return { minPitch: 48, maxPitch: 84 };
    let lo = Infinity;
    let hi = -Infinity;
    for (const n of notes) {
      if (n.pitch < lo) lo = n.pitch;
      if (n.pitch > hi) hi = n.pitch;
    }
    return { minPitch: lo - 2, maxPitch: hi + 2 };
  }, [notes]);

  useEffect(() => {
    return () => stop();
  }, []);

  const stop = () => {
    const transport = Tone.getTransport();
    scheduledIds.current.forEach((id) => transport.clear(id));
    scheduledIds.current = [];
    transport.stop();
    transport.position = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLocalPlaying(false);
    setLocalProgress(0);
  };

  const toggle = async () => {
    if (playing) {
      stop();
      return;
    }
    setLoading(true);
    await Tone.start();
    const sampler = await getPianoSampler();
    setLoading(false);
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    scheduledIds.current = notes.map((note) => {
      const id = transport.schedule((time) => {
        sampler.triggerAttackRelease(
          midiToNoteName(note.pitch),
          note.duration,
          time,
          note.velocity ?? 0.8,
        );
      }, note.start);
      return id;
    });
    transport.scheduleOnce(() => {
      stop();
    }, effectiveDuration + 0.2);
    startedAtRef.current = Tone.now();
    if (!isGloballyControlled) setLocalPlaying(true);
    transport.start();
    const tick = () => {
      const t = (Tone.now() - startedAtRef.current) / effectiveDuration;
      const p = Math.min(1, Math.max(0, t));
      if (!isGloballyControlled) setLocalProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const pitchRange = Math.max(1, maxPitch - minPitch);
  const currentTime = progress * effectiveDuration;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (inline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className="premium-icon-btn h-8 w-8"
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
        >
          {loading ? (
            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-current/40 border-t-current" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <div
          className={`relative h-6 flex-1 overflow-hidden rounded-input border border-[var(--border-primary)] ${isPro ? "waveform-shell-pro bg-black/35" : "bg-[var(--ui-input)]"}`}
        >
          <svg
            viewBox={`0 0 100 ${pitchRange}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {Array.from({ length: pitchRange }).map((_, i) => (
              <line
                key={i}
                x1={0}
                x2={100}
                y1={i}
                y2={i}
                stroke={gridStroke}
                strokeWidth={0.05}
              />
            ))}
            {notes.map((n, i) => {
              const x = (n.start / effectiveDuration) * 100;
              const w = Math.max(0.8, (n.duration / effectiveDuration) * 100);
              const y = pitchRange - (n.pitch - minPitch) - 1;
              const active = currentTime >= n.start && currentTime < n.start + n.duration;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y + 0.1}
                  width={w}
                  height={0.8}
                  rx={0.2}
                  ry={0.2}
                  fill={active ? noteActive : noteIdle}
                />
              );
            })}
          </svg>
          <div
            className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
            style={{ left: `${progress * 100}%`, opacity: playing ? 1 : 0 }}
          />
        </div>
        <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="app-btn-primary h-10 w-10 shrink-0 !px-0"
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
      >
        {loading ? (
          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <div
        className={`relative h-14 flex-1 overflow-hidden rounded-input border border-[var(--border-primary)] ${isPro ? "waveform-shell-pro bg-black/35" : "bg-[var(--ui-input)]"}`}
      >
        <svg
          viewBox={`0 0 100 ${pitchRange}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {Array.from({ length: pitchRange }).map((_, i) => (
            <line
              key={i}
              x1={0}
              x2={100}
              y1={i}
              y2={i}
              stroke={gridStroke}
              strokeWidth={0.05}
            />
          ))}
          {notes.map((n, i) => {
            const x = (n.start / effectiveDuration) * 100;
            const w = Math.max(0.8, (n.duration / effectiveDuration) * 100);
            const y = pitchRange - (n.pitch - minPitch) - 1;
            const active = currentTime >= n.start && currentTime < n.start + n.duration;
            return (
              <rect
                key={i}
                x={x}
                y={y + 0.1}
                width={w}
                height={0.8}
                rx={0.2}
                ry={0.2}
                fill={active ? noteActive : noteIdle}
              />
            );
          })}
        </svg>
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
          style={{ left: `${progress * 100}%`, opacity: playing ? 1 : 0 }}
        />
      </div>
    </div>
  );
}