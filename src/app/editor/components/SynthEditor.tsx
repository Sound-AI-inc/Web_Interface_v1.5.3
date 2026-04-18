import { useEffect, useRef } from "react";
import { useEditor } from "../core/store";
import { SynthEngine } from "../synth/engine";

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
        className="w-full accent-[#FF3C82]"
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
      <polyline points={points} fill="none" stroke="#FF3C82" strokeWidth={2} />
      <polyline
        points={`0,100 ${points.split(" ").slice(1).join(" ")}`}
        fill="rgba(255, 60, 130, 0.12)"
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

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="app-section-title">Envelope</h3>
          <div className="flex gap-1">
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
