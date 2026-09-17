import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { Pause, SlidersHorizontal } from "lucide-react";
import { useInterfaceMode } from "../../hooks/useInterfaceMode";
import type { PresetGlance } from "../../data/mock";
import { midiToNoteName } from "../../lib/pianoSampler";
import { usePreviewPlayback, usePreviewState } from "../../hooks/usePreviewPlayback";
import { useLanguage } from "../../i18n/LanguageProvider";

interface PresetPreviewProps {
  preset: PresetGlance;
  className?: string;
  assetId?: string;
  inline?: boolean;
}

const demoPhrase: { pitch: number; start: number; duration: number }[] = [
  { pitch: 60, start: 0.0, duration: 0.4 },
  { pitch: 64, start: 0.5, duration: 0.4 },
  { pitch: 67, start: 1.0, duration: 0.4 },
  { pitch: 72, start: 1.5, duration: 0.8 },
];

export default function PresetPreview({ preset, className = "", assetId, inline = false }: PresetPreviewProps) {
  const { mode } = useInterfaceMode();
  const { t } = useLanguage();
  const isPro = mode === "pro";
  const [localPlaying, setLocalPlaying] = useState(false);
  const synthRef = useRef<Tone.PolySynth<Tone.MonoSynth> | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const scheduledIds = useRef<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const { registerPreset, unregisterPreset } = usePreviewPlayback();
  const previewState = usePreviewState(assetId ?? "", "preset");
  const isGloballyControlled = assetId !== undefined;
  const playing = isGloballyControlled ? previewState.playing : localPlaying;
  const progress = isGloballyControlled ? previewState.progress : localProgress;
  const effectiveDuration = isGloballyControlled && previewState.duration > 0 ? previewState.duration : demoPhrase[demoPhrase.length - 1].start + demoPhrase[demoPhrase.length - 1].duration + preset.release;

  useEffect(() => {
    if (assetId) {
      registerPreset(assetId, {
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
      if (assetId) unregisterPreset(assetId);
    };
  }, [assetId, registerPreset, unregisterPreset, effectiveDuration, isGloballyControlled, localPlaying, preset]);

  useEffect(() => {
    return () => {
      stop();
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      synthRef.current = null;
      filterRef.current = null;
    };
  }, []);

  const buildChain = () => {
    filterRef.current?.dispose();
    synthRef.current?.dispose();
    const filter = new Tone.Filter({
      frequency: preset.filterCutoff,
      type: "lowpass",
      Q: preset.filterResonance,
    }).toDestination();
    const synth = new Tone.PolySynth(Tone.MonoSynth).connect(filter);
    synth.set({
      oscillator: { type: preset.oscillator },
      envelope: {
        attack: preset.attack,
        decay: preset.decay,
        sustain: preset.sustain,
        release: preset.release,
      },
    });
    filterRef.current = filter;
    synthRef.current = synth;
  };

  const stop = () => {
    const transport = Tone.getTransport();
    scheduledIds.current.forEach((id) => transport.clear(id));
    scheduledIds.current = [];
    transport.stop();
    transport.position = 0;
    synthRef.current?.releaseAll();
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
    buildChain();
    const synth = synthRef.current!;
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    const total = demoPhrase[demoPhrase.length - 1].start + demoPhrase[demoPhrase.length - 1].duration;
    scheduledIds.current = demoPhrase.map((n) =>
      transport.schedule((time) => {
        synth.triggerAttackRelease(midiToNoteName(n.pitch), n.duration, time, 0.7);
      }, n.start),
    );
    transport.scheduleOnce(() => stop(), total + preset.release + 0.1);
    transport.start();
    if (!isGloballyControlled) setLocalPlaying(true);
    startedAtRef.current = Tone.now();
    const tick = () => {
      const t = (Tone.now() - startedAtRef.current) / effectiveDuration;
      const p = Math.min(1, Math.max(0, t));
      if (!isGloballyControlled) setLocalProgress(p);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    setLoading(false);
  };

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
          aria-label={playing ? t("workspace.preview.stopPreview") : t("workspace.preview.preset")}
          aria-pressed={playing}
        >
          {loading ? (
            <span className="block h-3 w-3 animate-spin rounded-full border-2 border-current/40 border-t-current" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <SlidersHorizontal className="h-4 w-4" />
          )}
        </button>
        <div
          className={`grid h-6 flex-1 grid-cols-5 gap-1 rounded-input border border-[var(--border-primary)] p-1 font-codec text-[8px] ${isPro ? "waveform-shell-pro bg-black/35 text-white/80" : "bg-[var(--ui-input)] text-text/70"}`}
        >
          <EnvGlance preset={preset} isPro={isPro} />
          <ParamGlance label="Osc" value={preset.oscillator} />
          <ParamGlance label="Cutoff" value={`${Math.round(preset.filterCutoff)}Hz`} />
          <ParamGlance label="Res" value={preset.filterResonance.toFixed(2)} />
          <ParamGlance label="Rel" value={`${preset.release.toFixed(2)}s`} />
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
        aria-label={playing ? t("workspace.preview.stopPreview") : t("workspace.preview.preset")}
        aria-pressed={playing}
      >
        {loading ? (
          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <SlidersHorizontal className="h-4 w-4" />
        )}
      </button>
      <div
        className={`grid h-14 flex-1 grid-cols-6 gap-2 rounded-input border border-[var(--border-primary)] p-2 font-codec text-[10px] ${isPro ? "waveform-shell-pro bg-black/35 text-white/80" : "bg-[var(--ui-input)] text-text/70"}`}
      >
        <EnvGlance preset={preset} isPro={isPro} />
        <ParamGlance label="Osc" value={preset.oscillator} />
        <ParamGlance label="Cutoff" value={`${Math.round(preset.filterCutoff)}Hz`} />
        <ParamGlance label="Res" value={preset.filterResonance.toFixed(2)} />
        <ParamGlance label="Rel" value={`${preset.release.toFixed(2)}s`} />
        <ParamGlance label="Sustain" value={preset.sustain.toFixed(2)} />
      </div>
    </div>
  );
}

function EnvGlance({ preset, isPro }: { preset: PresetGlance; isPro: boolean }) {
  const total = preset.attack + preset.decay + 0.4 + preset.release;
  const ax = (preset.attack / total) * 100;
  const dx = ((preset.attack + preset.decay) / total) * 100;
  const sx = ((preset.attack + preset.decay + 0.4) / total) * 100;
  const sy = 100 - preset.sustain * 100;
  return (
    <div className="col-span-1 flex flex-col justify-between">
      <div className="font-poppins text-[9px] font-bold uppercase tracking-[0.08em] text-text/50">Env</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-5 w-full">
        <polyline
          fill="none"
          stroke={isPro ? "rgba(255,255,255,0.9)" : "rgb(var(--color-primary))"}
          strokeWidth={3}
          points={`0,100 ${ax},0 ${dx},${sy} ${sx},${sy} 100,100`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function ParamGlance({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-between">
      <div className="font-poppins text-[9px] font-bold uppercase tracking-[0.08em] text-text/50">{label}</div>
      <div className="truncate font-poppins text-[11px] font-semibold text-text">{value}</div>
    </div>
  );
}