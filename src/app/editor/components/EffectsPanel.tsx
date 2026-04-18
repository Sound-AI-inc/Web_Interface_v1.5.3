import { useEffect, useRef } from "react";
import { useEditor } from "../core/store";
import { EffectsChain } from "../audio/effects";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step = 0.01, onChange, unit }: SliderProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-codec text-xs font-medium text-text/70">{label}</span>
        <span className="font-codec text-[11px] text-text/50">
          {value.toFixed(step < 1 ? 2 : 0)}
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

interface EffectBlockProps {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}
function EffectBlock({ title, enabled, onToggle, children }: EffectBlockProps) {
  return (
    <div className="rounded-card border border-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-poppins text-[11px] font-bold uppercase tracking-wider text-text">
          {title}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            enabled ? "bg-primary" : "bg-surface"
          }`}
          aria-pressed={enabled}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      <div className={enabled ? "" : "pointer-events-none opacity-40"}>{children}</div>
    </div>
  );
}

export default function EffectsPanel() {
  const effects = useEditor((s) => s.effects);
  const setEffects = useEditor((s) => s.setEffects);
  const buffer = useEditor((s) => s.buffer);
  const chainRef = useRef<EffectsChain | null>(null);

  useEffect(() => {
    chainRef.current = new EffectsChain();
    return () => {
      chainRef.current?.dispose();
      chainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (buffer) chainRef.current?.loadBuffer(buffer);
  }, [buffer]);

  useEffect(() => {
    chainRef.current?.apply(effects);
  }, [effects]);

  const preview = async () => {
    const chain = chainRef.current;
    if (!chain || !buffer) return;
    chain.stop();
    await chain.loadBuffer(buffer);
    chain.apply(effects);
    await chain.play();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="app-section-title">Effects</h3>
        <button type="button" onClick={preview} className="app-btn-ghost h-8 px-3 text-xs">
          Preview
        </button>
      </div>

      <EffectBlock
        title="Reverb"
        enabled={effects.reverbEnabled}
        onToggle={() => setEffects({ reverbEnabled: !effects.reverbEnabled })}
      >
        <Slider
          label="Wet"
          value={effects.reverbWet}
          min={0}
          max={1}
          onChange={(v) => setEffects({ reverbWet: v })}
        />
      </EffectBlock>

      <EffectBlock
        title="Delay"
        enabled={effects.delayEnabled}
        onToggle={() => setEffects({ delayEnabled: !effects.delayEnabled })}
      >
        <Slider
          label="Time"
          value={effects.delayTime}
          min={0.01}
          max={1}
          onChange={(v) => setEffects({ delayTime: v })}
          unit="s"
        />
        <Slider
          label="Feedback"
          value={effects.delayFeedback}
          min={0}
          max={0.9}
          onChange={(v) => setEffects({ delayFeedback: v })}
        />
      </EffectBlock>

      <EffectBlock
        title="Chorus"
        enabled={effects.chorusEnabled}
        onToggle={() => setEffects({ chorusEnabled: !effects.chorusEnabled })}
      >
        <Slider
          label="Depth"
          value={effects.chorusDepth}
          min={0}
          max={1}
          onChange={(v) => setEffects({ chorusDepth: v })}
        />
      </EffectBlock>

      <EffectBlock
        title="Compressor"
        enabled={effects.compressorEnabled}
        onToggle={() => setEffects({ compressorEnabled: !effects.compressorEnabled })}
      >
        <Slider
          label="Threshold"
          value={effects.compressorThreshold}
          min={-60}
          max={0}
          step={1}
          onChange={(v) => setEffects({ compressorThreshold: v })}
          unit="dB"
        />
      </EffectBlock>

      <EffectBlock
        title="EQ"
        enabled={effects.eqEnabled}
        onToggle={() => setEffects({ eqEnabled: !effects.eqEnabled })}
      >
        <Slider
          label="Low"
          value={effects.eqLow}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => setEffects({ eqLow: v })}
          unit="dB"
        />
        <Slider
          label="Mid"
          value={effects.eqMid}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => setEffects({ eqMid: v })}
          unit="dB"
        />
        <Slider
          label="High"
          value={effects.eqHigh}
          min={-12}
          max={12}
          step={0.5}
          onChange={(v) => setEffects({ eqHigh: v })}
          unit="dB"
        />
      </EffectBlock>
    </div>
  );
}
