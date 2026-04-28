import { useEffect, useMemo, useState } from "react";
import { Clock3, Upload } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptInput from "../components/PromptInput";
import ControlDropdown from "../components/ControlDropdown";
import ResultsList from "../components/ResultsList";
import type { GenerationPreviewEntry } from "../components/ResultsList";
import IdeasMenu from "../components/IdeasMenu";
import { audioResults, type AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import {
  type GenerationType,
} from "../lib/promptGeneration";
import { generateResults } from "../lib/generationGateway";

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
const GENERATION_STAGES = [
  "Analyzing prompt",
  "Learning pattern",
  "Generating outputs",
  "Finalizing results",
] as const;
const MIN_GENERATION_VISUAL_MS = 3200;
const REVEAL_STEP_MS = 540;

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

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>(GENERATION_STAGES[0]);
  const [activeGenerationPrompt, setActiveGenerationPrompt] = useState("");
  const [generationEntries, setGenerationEntries] = useState<GenerationPreviewEntry[] | null>(null);

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

  const handleGenerate = async () => {
    if (isGenerating || prompt.trim().length < 3) return;

    const promptValue = prompt.trim();
    const previewEntries: GenerationPreviewEntry[] = Array.from(
      { length: generationCount },
      (_, index) => ({
        id: `pending-${Date.now()}-${index}`,
        status: index === 0 ? "Analyzing prompt" : index === 1 ? "Learning pattern" : "Queued",
        progress: index === 0 ? 0.12 : index === 1 ? 0.06 : 0.03,
      }),
    );

    setIsGenerating(true);
    setGenerationProgress(0.06);
    setGenerationStage(GENERATION_STAGES[0]);
    setActiveGenerationPrompt(promptValue);
    setGenerationWarning(null);
    setGenerationEntries(previewEntries);

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(0.94, elapsed / MIN_GENERATION_VISUAL_MS);
      const nextStageIndex = Math.min(
        GENERATION_STAGES.length - 1,
        Math.floor(nextProgress * GENERATION_STAGES.length),
      );
      setGenerationProgress(nextProgress);
      setGenerationStage(GENERATION_STAGES[nextStageIndex]);
      setGenerationEntries((current) =>
        current?.map((entry, index) => {
          if (entry.item) return entry;

          const shiftedProgress = Math.max(0.04, nextProgress - index * 0.18);
          const shiftedStageIndex = Math.min(
            GENERATION_STAGES.length - 1,
            Math.max(0, Math.floor(shiftedProgress * GENERATION_STAGES.length)),
          );

          return {
            ...entry,
            status:
              shiftedProgress < 0.12
                ? "Queued"
                : GENERATION_STAGES[shiftedStageIndex],
            progress: Math.min(0.86, Math.max(entry.progress, shiftedProgress)),
          };
        }) ?? null,
      );
    }, 120);

    try {
      const response = await generateResults({
        prompt: promptValue,
        mode: isPro ? "pro" : "lite",
        type: type as GenerationType,
        model: resolvedModel,
        format: resolvedFormat,
        count: generationCount,
      });
      const next = response.items;

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_GENERATION_VISUAL_MS) {
        await sleep(MIN_GENERATION_VISUAL_MS - elapsed);
      }

      window.clearInterval(progressTimer);
      setGenerationProgress(0.92);
      setGenerationStage(GENERATION_STAGES[GENERATION_STAGES.length - 1]);

      if (next.length === 0) return;

      setGenerationWarning(response.warning ?? null);

      for (let index = 0; index < next.length; index++) {
        setGenerationStage(`Revealing result ${index + 1}/${next.length}`);
        setGenerationProgress(Math.min(0.96, 0.92 + ((index + 1) / next.length) * 0.04));
        setGenerationEntries((current) =>
          current?.map((entry, entryIndex) => {
            if (entryIndex < index) return entry;
            if (entryIndex === index) {
              return {
                ...entry,
                status: "Finalizing result",
                progress: 0.96,
              };
            }
            if (entryIndex === index + 1) {
              return {
                ...entry,
                status: "Learning pattern",
                progress: Math.max(entry.progress, 0.42),
              };
            }
            return entry;
          }) ?? null,
        );
        await sleep(REVEAL_STEP_MS * 0.55);
        setGenerationEntries((current) =>
          current?.map((entry, entryIndex) =>
            entryIndex === index
              ? {
                  ...entry,
                  item: next[index],
                  status: "Ready",
                  progress: 1,
                }
              : entry,
          ) ?? null,
        );
        await sleep(REVEAL_STEP_MS * 0.45);
      }

      setGenerationProgress(1);
      setGenerationStage("Results ready");

      const createdAt = new Date();
      const batch: GenerationBatch = {
        id: `${createdAt.getTime()}`,
        prompt: promptValue,
        count: generationCount,
        type,
        model: resolvedModel,
        format: resolvedFormat,
        createdAt: formatBatchTimestamp(createdAt),
        items: next,
      };

      setHistory((prev) => [batch, ...prev]);
      setSelectedBatchId(batch.id);
      await sleep(220);
      setGenerationEntries(null);
    } catch (error) {
      setGenerationWarning(
        error instanceof Error ? error.message : "Generation failed unexpectedly.",
      );
      setGenerationEntries(null);
    } finally {
      window.clearInterval(progressTimer);
      setIsGenerating(false);
    }
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
            <IdeasMenu onPick={setPrompt} type={type as GenerationType} />
          </div>
        </header>

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onGenerate={handleGenerate}
          disabled={isGenerating}
          loading={isGenerating}
          generateLabel={isGenerating ? generationStage : "Generate"}
        />

        {generationWarning && (
          <p className="mt-2 font-codec text-[11px] italic text-text/55">
            {generationWarning}
          </p>
        )}

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
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          generationStage={generationStage}
          generationPrompt={activeGenerationPrompt}
          generationType={type}
          generationEntries={generationEntries}
        />
      </div>

      <section className="mt-4 rounded-card border border-primary/20 bg-white/80 p-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h2 className="font-poppins text-sm font-semibold text-text">
              Generation History
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
