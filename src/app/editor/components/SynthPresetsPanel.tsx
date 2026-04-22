import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useEditor } from "../core/store";
import type { SynthParams } from "../core/types";

interface Preset {
  id: string;
  name: string;
  description: string;
  params: SynthParams;
}

const PRESETS: Preset[] = [
  {
    id: "default",
    name: "Default",
    description: "Neutral starting point — balanced attack and sustain.",
    params: {
      attack: 0.02,
      decay: 0.15,
      sustain: 0.6,
      release: 0.4,
      filterCutoff: 1200,
      filterResonance: 1,
      lfoRate: 4,
      lfoDepth: 0,
    },
  },
  {
    id: "pluck",
    name: "Pluck",
    description: "Fast attack, short decay. Great for staccato arpeggios.",
    params: {
      attack: 0.005,
      decay: 0.18,
      sustain: 0.1,
      release: 0.2,
      filterCutoff: 2800,
      filterResonance: 2.5,
      lfoRate: 6,
      lfoDepth: 0,
    },
  },
  {
    id: "pad",
    name: "Warm Pad",
    description: "Slow bloom with airy filter movement.",
    params: {
      attack: 0.8,
      decay: 0.6,
      sustain: 0.8,
      release: 1.6,
      filterCutoff: 900,
      filterResonance: 1.2,
      lfoRate: 0.4,
      lfoDepth: 0.3,
    },
  },
  {
    id: "bass",
    name: "Sub Bass",
    description: "Tight low-end with quick punch and minimal release.",
    params: {
      attack: 0.003,
      decay: 0.25,
      sustain: 0.4,
      release: 0.25,
      filterCutoff: 420,
      filterResonance: 3,
      lfoRate: 2,
      lfoDepth: 0,
    },
  },
  {
    id: "lead",
    name: "Cutting Lead",
    description: "Bright resonant filter for solos and hooks.",
    params: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.7,
      release: 0.5,
      filterCutoff: 3800,
      filterResonance: 6,
      lfoRate: 5,
      lfoDepth: 0.2,
    },
  },
];

/** Contextual side panel for the Synth tab — preset browser. */
export default function SynthPresetsPanel() {
  const synth = useEditor((s) => s.synth);
  const setSynth = useEditor((s) => s.setSynth);

  const apply = (p: Preset) => setSynth(p.params);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="app-section-title">Presets</h3>
        <span className="inline-flex items-center gap-1 font-codec text-[11px] text-text/50">
          <SlidersHorizontal className="h-3 w-3" />
          {PRESETS.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {PRESETS.map((p) => {
          const active =
            Math.abs(synth.attack - p.params.attack) < 1e-3 &&
            Math.abs(synth.decay - p.params.decay) < 1e-3 &&
            Math.abs(synth.sustain - p.params.sustain) < 1e-3 &&
            Math.abs(synth.filterCutoff - p.params.filterCutoff) < 1;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => apply(p)}
              className={`rounded-card border p-3 text-left transition-colors ${
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-surface bg-white hover:border-primary/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-poppins text-sm font-medium text-text">{p.name}</div>
                {active && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-poppins text-[9px] font-bold uppercase tracking-wider text-primary">
                    Active
                  </span>
                )}
              </div>
              <p className="app-meta mt-0.5">{p.description}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => apply(PRESETS[0])}
        className="app-btn-ghost h-9 w-full"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset to default
      </button>
    </div>
  );
}
