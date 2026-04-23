import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Pause } from "lucide-react";
import { getPianoSampler, midiToNoteName } from "../../lib/pianoSampler";
import type { MidiNoteLite } from "../../data/mock";

interface MidiPreviewProps {
  notes: MidiNoteLite[];
  durationSeconds: number;
  className?: string;
}

/**
 * Piano-roll visualization + playback via a shared Salamander Grand Piano
 * Tone.Sampler. Shows the moving playhead and highlights currently active notes.
 */
export default function MidiPreview({ notes, durationSeconds, className = "" }: MidiPreviewProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const scheduledIds = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => {
    const transport = Tone.getTransport();
    scheduledIds.current.forEach((id) => transport.clear(id));
    scheduledIds.current = [];
    transport.stop();
    transport.position = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
    setProgress(0);
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
    }, durationSeconds + 0.2);
    startedAtRef.current = Tone.now();
    setPlaying(true);
    transport.start();
    const tick = () => {
      const t = (Tone.now() - startedAtRef.current) / durationSeconds;
      setProgress(Math.min(1, Math.max(0, t)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const pitchRange = Math.max(1, maxPitch - minPitch);
  const currentTime = progress * durationSeconds;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="app-btn-primary h-10 w-10 shrink-0 !px-0"
        aria-label={playing ? "Pause" : "Play"}
      >
        {loading ? (
          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <div className="relative h-14 flex-1 overflow-hidden rounded-input border border-surface bg-white">
        {/* Horizontal pitch grid */}
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
              stroke="#EFF3F6"
              strokeWidth={0.05}
            />
          ))}
          {notes.map((n, i) => {
            const x = (n.start / durationSeconds) * 100;
            const w = Math.max(0.8, (n.duration / durationSeconds) * 100);
            const y = pitchRange - (n.pitch - minPitch) - 1;
            const active =
              currentTime >= n.start && currentTime < n.start + n.duration;
            return (
              <rect
                key={i}
                x={x}
                y={y + 0.1}
                width={w}
                height={0.8}
                rx={0.2}
                ry={0.2}
                fill={active ? "#FF3C82" : "#FF98A8"}
              />
            );
          })}
        </svg>
        {/* Playhead */}
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary"
          style={{ left: `${progress * 100}%`, opacity: playing ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
