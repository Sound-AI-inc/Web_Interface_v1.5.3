import { useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptInput from "../components/PromptInput";
import ControlDropdown from "../components/ControlDropdown";
import ResultsList from "../components/ResultsList";
import IdeasMenu from "../components/IdeasMenu";
import { audioResults, type AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import {
  generateFromPrompt,
  type GenerationType,
} from "../lib/promptGeneration";

// --- Lite mode ---------------------------------------------------------------
// Single type (Audio Sample). Models come from Hugging Face. Output is MP3 only.
const LITE_TYPES = ["Audio Sample"] as const;
const LITE_MODELS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": ["ACE-STEP", "Mus Meta", "Diffusion"],
};
const LITE_FORMATS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": ["MP3"],
};

// --- Pro mode ----------------------------------------------------------------
// Three types. Each type is bound to one SoundAI model, which in turn drives
// the list of allowed output formats.
const PRO_TYPES = ["Audio Sample", "MIDI Melody", "VST Preset"] as const;
const PRO_MODELS_BY_TYPE: Record<(typeof PRO_TYPES)[number], string[]> = {
  "Audio Sample": ["SoundCraft"],
  "MIDI Melody": ["MidiCraft"],
  "VST Preset": ["VSTCraft"],
};
const PRO_FORMATS_BY_TYPE: Record<(typeof PRO_TYPES)[number], string[]> = {
  "Audio Sample": ["WAV", "FLAC", "OGG"],
  "MIDI Melody": ["MIDI"],
  "VST Preset": [
    "VST3 (.vstpreset)",
    "VST2 (.fxp)",
    "VST Bank (.fxb)",
    "Serum (.fxp)",
    "Vital (.vital)",
    "Massive (.nmsv)",
    "Ableton Rack (.adv)",
    "Logic Pro (.aupreset)",
  ],
};

export default function AudioGenerator() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const typeOptions: string[] = useMemo(
    () => (isPro ? [...PRO_TYPES] : [...LITE_TYPES]),
    [isPro],
  );

  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<string>(typeOptions[0]);

  // When the mode switches, make sure the current type is still valid.
  useEffect(() => {
    if (!typeOptions.includes(type)) {
      setType(typeOptions[0]);
    }
  }, [typeOptions, type]);

  const modelOptions = useMemo(() => {
    if (isPro) {
      const key = type as (typeof PRO_TYPES)[number];
      return PRO_MODELS_BY_TYPE[key] ?? PRO_MODELS_BY_TYPE["Audio Sample"];
    }
    const key = type as (typeof LITE_TYPES)[number];
    return LITE_MODELS_BY_TYPE[key] ?? LITE_MODELS_BY_TYPE["Audio Sample"];
  }, [isPro, type]);

  const formatOptions = useMemo(() => {
    if (isPro) {
      const key = type as (typeof PRO_TYPES)[number];
      return PRO_FORMATS_BY_TYPE[key] ?? PRO_FORMATS_BY_TYPE["Audio Sample"];
    }
    const key = type as (typeof LITE_TYPES)[number];
    return LITE_FORMATS_BY_TYPE[key] ?? LITE_FORMATS_BY_TYPE["Audio Sample"];
  }, [isPro, type]);

  const [model, setModel] = useState(modelOptions[0]);
  const [format, setFormat] = useState(formatOptions[0]);

  const resolvedModel = modelOptions.includes(model) ? model : modelOptions[0];
  const resolvedFormat = formatOptions.includes(format) ? format : formatOptions[0];

  // Keep local state in sync whenever the derived options collapse.
  useEffect(() => {
    if (!modelOptions.includes(model)) setModel(modelOptions[0]);
  }, [modelOptions, model]);
  useEffect(() => {
    if (!formatOptions.includes(format)) setFormat(formatOptions[0]);
  }, [formatOptions, format]);

  const [saved, setSaved] = useState<Set<string>>(new Set());

  const handleAddToLibrary = (item: AudioResult) => {
    setSaved((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleRemix = (item: AudioResult) => {
    setPrompt((p) => (p ? `${p} · remix of ${item.title}` : `Remix of ${item.title}`));
  };

  // Debounced prompt so we don't regenerate previews on every keystroke.
  const [debouncedPrompt, setDebouncedPrompt] = useState(prompt);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedPrompt(prompt), 280);
    return () => window.clearTimeout(handle);
  }, [prompt]);

  const livePreviews = useMemo<AudioResult[]>(() => {
    return generateFromPrompt({
      prompt: debouncedPrompt,
      mode: isPro ? "pro" : "lite",
      type: type as GenerationType,
      model: resolvedModel,
      format: resolvedFormat,
      count: 3,
    });
  }, [debouncedPrompt, isPro, type, resolvedModel, resolvedFormat]);

  const showLive = livePreviews.length > 0;

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
          <div className="flex items-center gap-2">
            {isPro && (
              <button className="app-btn-ghost h-9 px-3 text-xs">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
            )}
            <IdeasMenu onPick={setPrompt} />
          </div>
        </header>

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={() => {
            /* stub */
          }}
        />

        {isPro && (
          <p className="mt-2 font-codec text-xs italic text-text/50">
            Smart suggestions adapt as you type. Type, model and output format stay in sync.
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <ControlDropdown
            label="Type"
            value={type}
            options={typeOptions}
            onChange={setType}
          />
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

        {!isPro && (
          <p className="mt-3 font-codec text-[11px] italic text-text/50">
            Lite mode: Audio Sample only · Hugging Face models · MP3 output. Switch to Pro to unlock MIDI and VST generation.
          </p>
        )}
      </section>

      {showLive && (
        <div className="mt-4">
          <ResultsList
            items={livePreviews}
            title="Live preview"
            savedIds={saved}
            onAddToLibrary={handleAddToLibrary}
            onRemix={handleRemix}
          />
        </div>
      )}

      <div className="mt-4">
        <ResultsList
          items={audioResults}
          title={showLive ? "Recent generations" : "AudioResults"}
          savedIds={saved}
          onAddToLibrary={handleAddToLibrary}
          onRemix={handleRemix}
        />
      </div>
    </PageContainer>
  );
}
