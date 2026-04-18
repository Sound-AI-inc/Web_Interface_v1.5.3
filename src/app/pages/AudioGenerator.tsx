import { useMemo, useState } from "react";
import { Upload, Lightbulb } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptInput from "../components/PromptInput";
import ControlDropdown from "../components/ControlDropdown";
import ResultsList from "../components/ResultsList";
import { audioResults } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

const TYPE_OPTIONS = ["Audio Sample", "MIDI Melody", "VST Preset"];
const MODEL_OPTIONS_PRO = ["SoundCraft v1", "MidiCraft", "SoundCraft"];
const MODEL_OPTIONS_LITE = ["ACE-STEP V1.5", "Mus Meta v2.5", "Diffusion v4.5"];
const FORMAT_OPTIONS_PRO = ["WAV Audio", "MP3 Audio", "FLAC", "OGG"];
const FORMAT_OPTIONS_LITE = ["MP3 Audio"];

export default function AudioGenerator() {
  const { mode } = useInterfaceMode();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const modelOptions = mode === "pro" ? MODEL_OPTIONS_PRO : MODEL_OPTIONS_LITE;
  const formatOptions = mode === "pro" ? FORMAT_OPTIONS_PRO : FORMAT_OPTIONS_LITE;
  const [model, setModel] = useState(modelOptions[0]);
  const [format, setFormat] = useState(formatOptions[0]);

  // Re-sync model/format when mode switches so the available options stay valid.
  const resolvedModel = useMemo(
    () => (modelOptions.includes(model) ? model : modelOptions[0]),
    [modelOptions, model],
  );
  const resolvedFormat = useMemo(
    () => (formatOptions.includes(format) ? format : formatOptions[0]),
    [formatOptions, format],
  );

  return (
    <PageContainer
      title="Create audio with AI"
      subtitle="Audio Generator"
      actions={
        <div className="rounded-card border-2 border-primary px-4 py-2 text-center">
          <div className="font-poppins text-[11px] font-medium text-text/60">Credits</div>
          <div className="font-poppins text-sm font-semibold text-text">42 remaining</div>
        </div>
      }
    >
      <section className="rounded-card border border-primary/40 p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="font-poppins text-sm font-semibold text-text">AdaptivePrompt</h2>
          {mode === "pro" && (
            <div className="flex items-center gap-2">
              <button className="app-btn-ghost h-8 px-3 text-xs">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
              <button className="app-btn-ghost h-8 px-3 text-xs">
                Ideas <Lightbulb className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </header>

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={() => {
            /* stub */
          }}
        />

        {mode === "pro" && (
          <p className="mt-2 font-codec text-xs italic text-text/50">
            Smart suggestions adapt as you type to improve generation quality.
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <ControlDropdown label="Type" value={type} options={TYPE_OPTIONS} onChange={setType} />
          <ControlDropdown
            label="Model"
            value={resolvedModel}
            options={modelOptions}
            onChange={setModel}
          />
          <ControlDropdown
            label="Output Format"
            value={resolvedFormat}
            options={formatOptions}
            onChange={setFormat}
          />
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-card border border-surface p-2">
          <Segmented
            items={TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />
        </div>
        <div className="rounded-card border border-surface p-2">
          <Segmented
            items={modelOptions}
            value={resolvedModel}
            onChange={setModel}
          />
        </div>
      </div>

      <div className="mt-4">
        <ResultsList items={audioResults} />
      </div>
    </PageContainer>
  );
}

interface SegmentedProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}

function Segmented({ items, value, onChange }: SegmentedProps) {
  return (
    <div className="flex flex-col">
      {items.map((item) => {
        const active = item === value;
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-button px-4 py-2.5 text-left font-codec text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-text/80 hover:bg-surface"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
