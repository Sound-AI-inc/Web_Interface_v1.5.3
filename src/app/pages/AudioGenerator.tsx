import { useEffect, useMemo, useState } from "react";
import { Clock3, Upload } from "lucide-react";
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

const LITE_TYPES = ["Audio Sample"] as const;
const LITE_MODELS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": ["ACE-STEP", "Mus Meta", "Diffusion"],
};
const LITE_FORMATS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": ["MP3"],
};

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

const GENERATION_COUNTS = ["1", "2", "3", "4", "5"];

interface GenerationBatch {
  id: string;
  prompt: string;
  count: number;
  type: string;
  model: string;
  format: string;
  createdAt: string;
  items: AudioResult[];
}

function formatBatchTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AudioGenerator() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const typeOptions: string[] = useMemo(
    () => (isPro ? [...PRO_TYPES] : [...LITE_TYPES]),
    [isPro],
  );

  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<string>(typeOptions[0]);
  const [generationCount, setGenerationCount] = useState(3);

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

  useEffect(() => {
    if (!modelOptions.includes(model)) setModel(modelOptions[0]);
  }, [modelOptions, model]);

  useEffect(() => {
    if (!formatOptions.includes(format)) setFormat(formatOptions[0]);
  }, [formatOptions, format]);

  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<GenerationBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const handleAddToLibrary = (item: AudioResult) => {
    setSaved((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleRemix = (item: AudioResult) => {
    setPrompt((value) =>
      value ? `${value} - remix of ${item.title}` : `Remix of ${item.title}`,
    );
  };

  const handleGenerate = () => {
    const next = generateFromPrompt({
      prompt,
      mode: isPro ? "pro" : "lite",
      type: type as GenerationType,
      model: resolvedModel,
      format: resolvedFormat,
      count: generationCount,
    });

    if (next.length === 0) return;

    const createdAt = new Date();
    const batch: GenerationBatch = {
      id: `${createdAt.getTime()}`,
      prompt: prompt.trim(),
      count: generationCount,
      type,
      model: resolvedModel,
      format: resolvedFormat,
      createdAt: formatBatchTimestamp(createdAt),
      items: next,
    };

    setHistory((prev) => [batch, ...prev]);
    setSelectedBatchId(batch.id);
  };

  const activeBatch = useMemo(() => {
    if (history.length === 0) return null;
    return (
      history.find((batch) => batch.id === selectedBatchId) ??
      history[0]
    );
  }, [history, selectedBatchId]);

  const activeItems = activeBatch?.items ?? audioResults;

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
          onGenerate={handleGenerate}
        />

        {isPro && (
          <p className="mt-2 font-codec text-xs italic text-text/50">
            Smart suggestions adapt as you type. Type, model and output format stay in sync.
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
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
            label="Generations"
            value={String(generationCount)}
            options={GENERATION_COUNTS}
            onChange={(value) => setGenerationCount(Number(value))}
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
            Lite mode: Audio Sample only, Hugging Face models, MP3 output. Switch to Pro to unlock MIDI and VST generation.
          </p>
        )}
      </section>

      <div className="mt-4">
        <ResultsList
          items={activeItems}
          title="Results"
          savedIds={saved}
          onAddToLibrary={handleAddToLibrary}
          onRemix={handleRemix}
          initialVisible={3}
        />
      </div>

      <section className="mt-4 rounded-card border border-primary/20 bg-white/80 p-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h2 className="font-poppins text-sm font-semibold text-text">
              История генераций
            </h2>
          </div>
          {activeBatch && (
            <span className="app-meta">
              {activeBatch.createdAt} - {activeBatch.count} result{activeBatch.count > 1 ? "s" : ""}
            </span>
          )}
        </header>

        {history.length > 0 ? (
          <div className="flex flex-col gap-2">
            {history.map((batch) => {
              const selected = batch.id === activeBatch?.id;
              return (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`flex items-start justify-between gap-4 rounded-input border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-primary/40 bg-primary/5"
                      : "border-surface bg-white hover:border-primary/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-poppins text-xs font-semibold text-text">
                      {batch.prompt || "Untitled prompt"}
                    </div>
                    <div className="app-meta mt-1">
                      {batch.type} - {batch.model} - {batch.format}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="app-meta">{batch.createdAt}</div>
                    <div className="mt-1 font-poppins text-[11px] font-medium text-text/70">
                      {batch.count} generation{batch.count > 1 ? "s" : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-surface bg-surface-muted p-8 text-center">
            <p className="font-poppins text-sm font-medium text-text/70">
              Your generation history will appear here.
            </p>
            <p className="app-meta mt-1">
              Run a prompt once to keep reusable result batches below the main results panel.
            </p>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
