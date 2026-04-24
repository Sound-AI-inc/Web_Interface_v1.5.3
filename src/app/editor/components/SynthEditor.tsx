import { useEffect, useRef } from "react";
import { Play, RotateCcw, Upload, FolderOpen } from "lucide-react";
import { useEditor } from "../core/store";
import { SynthEngine } from "../synth/engine";
import LibraryImportMenu from "./LibraryImportMenu";
import type { SynthParams } from "../core/types";

const DEFAULT_SYNTH = {
  attack: 0.02,
  decay: 0.15,
  sustain: 0.6,
  release: 0.4,
  filterCutoff: 1200,
  filterResonance: 1,
  lfoRate: 4,
  lfoDepth: 0,
};

interface ParamKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Param({ label, value, min, max, step = 0.01, unit, onChange }: ParamKnobProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-codec text-xs font-medium text-text/70">{label}</span>
        <span className="font-codec text-[11px] text-text/50">
          {step < 1 ? value.toFixed(2) : value.toFixed(0)}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="app-range w-full"
      />
    </div>
  );
}

/** Visualize the ADSR envelope as a simple polyline. */
function EnvelopeGraph({
  a,
  d,
  s,
  r,
}: {
  a: number;
  d: number;
  s: number;
  r: number;
}) {
  const total = Math.max(1, a + d + 1 + r);
  const ax = (a / total) * 100;
  const dx = ((a + d) / total) * 100;
  const sx = ((a + d + 1) / total) * 100;
  const rx = 100;
  const sY = 100 - s * 100;
  const points = `0,100 ${ax},0 ${dx},${sY} ${sx},${sY} ${rx},100`;
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-full rounded-card bg-surface-muted" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="rgb(var(--color-primary))" strokeWidth={2} />
      <polyline
        points={`0,100 ${points.split(" ").slice(1).join(" ")}`}
        fill="rgba(var(--color-primary-rgb), 0.12)"
      />
    </svg>
  );
}

export default function SynthEditor() {
  const synth = useEditor((s) => s.synth);
  const setSynth = useEditor((s) => s.setSynth);
  const engineRef = useRef<SynthEngine | null>(null);

  useEffect(() => {
    engineRef.current = new SynthEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.applyParams(synth);
  }, [synth]);

  const playNote = async (note: string) => {
    await engineRef.current?.playTestNote(note, 0.6);
  };

  // Short preview that exercises the full envelope shape so the user hears
  // what Attack / Decay / Sustain / Release actually do with current values.
  const previewEnvelope = async () => {
    const totalShort = Math.max(0.35, synth.attack + synth.decay + 0.2);
    await playNote("C4");
    void totalShort;
  };

  const resetSynth = () => setSynth(DEFAULT_SYNTH);

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SynthParams>;
      setSynth({
        attack: Number(parsed.attack ?? synth.attack),
        decay: Number(parsed.decay ?? synth.decay),
        sustain: Number(parsed.sustain ?? synth.sustain),
        release: Number(parsed.release ?? synth.release),
        filterCutoff: Number(parsed.filterCutoff ?? synth.filterCutoff),
        filterResonance: Number(parsed.filterResonance ?? synth.filterResonance),
        lfoRate: Number(parsed.lfoRate ?? synth.lfoRate),
        lfoDepth: Number(parsed.lfoDepth ?? synth.lfoDepth),
      });
    } catch {
      // ignore malformed files
    }
  };

  const onImportLibraryPreset = (params: SynthParams) => setSynth(params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="app-btn-ghost h-9 cursor-pointer px-3">
          <Upload className="h-3.5 w-3.5" /> Import preset
          <input
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
        </label>
        <LibraryImportMenu
          kind="preset"
          trigger={
            <span className="app-btn-ghost h-9 px-3">
              <FolderOpen className="h-3.5 w-3.5" /> Import from library
            </span>
          }
          onImportPreset={onImportLibraryPreset}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="app-section-title">Envelope</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={previewEnvelope}
              className="app-btn-primary h-8 px-2 text-[11px]"
              title="Preview envelope"
            >
              <Play className="h-3 w-3" /> Preview
            </button>
            {["C3", "E3", "G3", "C4", "E4"].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => playNote(n)}
                className="app-btn-ghost h-8 px-2 text-[11px]"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={resetSynth}
              className="app-btn-ghost h-8 px-2 text-[11px]"
              title="Reset all synth parameters"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
        <EnvelopeGraph
          a={synth.attack}
          d={synth.decay}
          s={synth.sustain}
          r={synth.release}
        />
        <div className="grid grid-cols-4 gap-4">
          <Param label="Attack" value={synth.attack} min={0} max={2} onChange={(v) => setSynth({ attack: v })} unit="s" />
          <Param label="Decay" value={synth.decay} min={0} max={2} onChange={(v) => setSynth({ decay: v })} unit="s" />
          <Param label="Sustain" value={synth.sustain} min={0} max={1} onChange={(v) => setSynth({ sustain: v })} />
          <Param label="Release" value={synth.release} min={0} max={3} onChange={(v) => setSynth({ release: v })} unit="s" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="app-section-title">Filter</h3>
        <div className="grid grid-cols-2 gap-4">
          <Param
            label="Cutoff"
            value={synth.filterCutoff}
            min={60}
            max={18000}
            step={10}
            onChange={(v) => setSynth({ filterCutoff: v })}
            unit="Hz"
          />
          <Param
            label="Resonance"
            value={synth.filterResonance}
            min={0.1}
            max={20}
            step={0.1}
            onChange={(v) => setSynth({ filterResonance: v })}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="app-section-title">LFO → Cutoff</h3>
        <div className="grid grid-cols-2 gap-4">
          <Param
            label="Rate"
            value={synth.lfoRate}
            min={0.1}
            max={20}
            step={0.1}
            onChange={(v) => setSynth({ lfoRate: v })}
            unit="Hz"
          />
          <Param
            label="Depth"
            value={synth.lfoDepth}
            min={0}
            max={1}
            onChange={(v) => setSynth({ lfoDepth: v })}
          />
        </div>
      </section>
    </div>
  );
}
