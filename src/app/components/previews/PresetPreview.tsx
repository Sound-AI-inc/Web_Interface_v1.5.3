import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { Play, Pause } from "lucide-react";
import type { PresetGlance } from "../../data/mock";
import { midiToNoteName } from "../../lib/pianoSampler";

interface PresetPreviewProps {
  preset: PresetGlance;
  className?: string;
}

const demoPhrase: { pitch: number; start: number; duration: number }[] = [
  { pitch: 60, start: 0.0, duration: 0.4 },
  { pitch: 64, start: 0.5, duration: 0.4 },
  { pitch: 67, start: 1.0, duration: 0.4 },
  { pitch: 72, start: 1.5, duration: 0.8 },
];

export default function PresetPreview({ preset, className = "" }: PresetPreviewProps) {
  const [playing, setPlaying] = useState(false);
  const synthRef = useRef<Tone.PolySynth<Tone.MonoSynth> | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const scheduledIds = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      stop();
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      synthRef.current = null;
      filterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPlaying(false);
  };

  const toggle = async () => {
    if (playing) {
      stop();
      return;
    }
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
    setPlaying(true);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="app-btn-primary h-10 w-10 shrink-0 !px-0"
        aria-label={playing ? "Stop preview" : "Preview preset"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="grid h-14 flex-1 grid-cols-6 gap-2 rounded-input border border-surface bg-surface-muted p-2 font-codec text-[10px] text-text/70">
        <EnvGlance preset={preset} />
        <ParamGlance label="Osc" value={preset.oscillator} />
        <ParamGlance label="Cutoff" value={`${Math.round(preset.filterCutoff)}Hz`} />
        <ParamGlance label="Res" value={preset.filterResonance.toFixed(2)} />
        <ParamGlance label="Rel" value={`${preset.release.toFixed(2)}s`} />
        <ParamGlance label="Sustain" value={preset.sustain.toFixed(2)} />
      </div>
    </div>
  );
}

function EnvGlance({ preset }: { preset: PresetGlance }) {
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
          stroke="rgb(var(--color-primary))"
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
