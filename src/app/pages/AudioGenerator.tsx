import { useEffect, useMemo, useState } from "react";
import { Coins, Sparkles } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptInput from "../components/PromptInput";
import BrandSelect from "../components/BrandSelect";
import type { AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import type { GenerationType } from "../lib/promptGeneration";
import { generateResults } from "../lib/generationGateway";
import ResultCard, { toCardItem } from "../components/ResultCard";

const LITE_TYPES = ["Audio Sample"] as const;
const LITE_MODELS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": [
    "facebook/musicgen-small",
    "facebook/audiogen-medium",
    "stabilityai/stable-audio-open-small",
    "chinedudave06/musicgen-small-onnx",
  ],
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
const QUICK_IDEAS = [
  "Dark techno kick with sub tail",
  "Ambient texture for intro, 8 bars",
  "Serum bass preset, aggressive mid-range",
  "MIDI chord progression in D minor, 90 BPM",
];
const FORMAT_TAGS = ["Audio Sample", "MIDI", "VST Preset"];
const MIN_GENERATION_VISUAL_MS = 1800;
const CREDITS_TOTAL = 50;
const CREDITS_REMAINING = 42;
const COMPOSER_INPUT_ID = "generator-composer-input";

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

interface PendingGeneration {
  id: string;
  prompt: string;
  count: number;
  type: string;
  model: string;
  format: string;
  stage: string;
  progress: number;
}

interface PromptControlConfig {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
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
  const { mode, setMode } = useInterfaceMode();
  const isPro = mode === "pro";

  const typeOptions: string[] = useMemo(
    () => (isPro ? [...PRO_TYPES] : [...LITE_TYPES]),
    [isPro],
  );

  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<string>(typeOptions[0]);
  const [generationCount, setGenerationCount] = useState(3);

  useEffect(() => {
    if (!typeOptions.includes(type)) setType(typeOptions[0]);
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
  const [pending, setPending] = useState<PendingGeneration | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasFeed = history.length > 0 || Boolean(pending);

  const promptControls: PromptControlConfig[] = useMemo(
    () => [
      { label: "Type", value: type, options: typeOptions, onChange: setType },
      { label: "Model", value: resolvedModel, options: modelOptions, onChange: setModel },
      {
        label: "Generations",
        value: String(generationCount),
        options: GENERATION_COUNTS,
        onChange: (value: string) => setGenerationCount(Number(value)),
      },
      { label: "Format", value: resolvedFormat, options: formatOptions, onChange: setFormat },
    ],
    [type, typeOptions, resolvedModel, modelOptions, generationCount, resolvedFormat, formatOptions],
  );

  const handleAddToLibrary = (item: AudioResult) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleRemix = (item: AudioResult) => {
    setPrompt((value) =>
      value ? `${value} - reuse ${item.title}` : `Reuse ${item.title} as a new variation`,
    );
    document.getElementById("audio-generator-composer")?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const handleGenerate = async () => {
    if (isGenerating || prompt.trim().length < 3) return;

    const promptValue = prompt.trim();
    const pendingId = `${Date.now()}`;
    setIsGenerating(true);
    setGenerationWarning(null);
    setPending({
      id: pendingId,
      prompt: promptValue,
      count: generationCount,
      type,
      model: resolvedModel,
      format: resolvedFormat,
      stage: GENERATION_STAGES[0],
      progress: 0.12,
    });

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(0.92, elapsed / MIN_GENERATION_VISUAL_MS);
      const nextStageIndex = Math.min(
        GENERATION_STAGES.length - 1,
        Math.floor(nextProgress * GENERATION_STAGES.length),
      );
      setPending((current) =>
        current
          ? {
              ...current,
              stage: GENERATION_STAGES[nextStageIndex],
              progress: nextProgress,
            }
          : current,
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

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_GENERATION_VISUAL_MS) {
        await sleep(MIN_GENERATION_VISUAL_MS - elapsed);
      }

      setGenerationWarning(response.warning ?? null);
      const createdAt = new Date();
      const batch: GenerationBatch = {
        id: pendingId,
        prompt: promptValue,
        count: generationCount,
        type,
        model: resolvedModel,
        format: resolvedFormat,
        createdAt: formatBatchTimestamp(createdAt),
        items: response.items,
      };

      setHistory((prev) => [...prev, batch]);
      setPrompt("");
      setPending(null);
    } catch (error) {
      setGenerationWarning(
        error instanceof Error ? error.message : "Generation failed unexpectedly.",
      );
      setPending(null);
    } finally {
      window.clearInterval(progressTimer);
      setIsGenerating(false);
    }
  };

  const controls = (
    <>
      {promptControls.map((control) => (
        <PromptControl key={control.label} {...control} />
      ))}
    </>
  );

  const activityChips = (
    <div className="flex flex-wrap items-center gap-2">
      {FORMAT_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => {
            if (tag === "MIDI") setType("MIDI Melody");
            else if (tag === "VST Preset") setType("VST Preset");
            else setType("Audio Sample");
          }}
          disabled={!isPro && tag !== "Audio Sample"}
          className="quick-chip px-3 py-1.5 font-codec text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          {tag}
        </button>
      ))}
    </div>
  );

  const creditsLow = CREDITS_REMAINING / CREDITS_TOTAL < 0.2;

  return (
    <PageContainer
      headerLayout="brand"
      userInitials="D"
      title={hasFeed ? "" : "Audio Generator"}
      actions={
        <div
          className={`credits-pill flex items-center gap-2 ${creditsLow ? "credits-pill--low" : ""}`}
          title={creditsLow ? "Low credits — upgrade plan" : undefined}
        >
          <Coins className="h-4 w-4 text-primary" />
          <span>
            <span className={creditsLow ? "text-primary" : ""}>{CREDITS_REMAINING}</span>{" "}
            <span className="text-text/55">Credits</span>
          </span>
        </div>
      }
    >
      <div className="generator-page flex flex-col">
        {!hasFeed ? (
          <section className="flex min-h-[calc(100vh-112px)] flex-col items-center justify-center px-2 pb-8">
            <div className="mx-auto w-full max-w-[760px] text-center">
              <h1 className="generator-hero-title font-syne text-[40px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
                Create your next sound
              </h1>
              <p className="mx-auto mt-4 max-w-[560px] font-codec text-base leading-7 text-text/55">
                Describe the mood, instruments, texture and output you want
              </p>
              <div className="mx-auto mt-10 w-full max-w-[680px]">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  onGenerate={handleGenerate}
                  disabled={isGenerating}
                  loading={isGenerating}
                  generateLabel={isGenerating ? "Generating" : "Create"}
                  mode={isPro ? "pro" : "lite"}
                  layout="hero"
                  controls={controls}
                  activityChips={activityChips}
                  onModeChange={(nextMode) => setMode(nextMode)}
                />
              </div>
              <QuickIdeas onPick={setPrompt} />
              {generationWarning && (
                <p className="mt-4 font-codec text-sm text-primary">{generationWarning}</p>
              )}
            </div>
          </section>
        ) : (
          <section className="feed-enter mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-2 pb-[120px] pt-6">
            {history.map((batch) => (
              <GenerationThread
                key={batch.id}
                batch={batch}
                saved={saved}
                onAddToLibrary={handleAddToLibrary}
                onRemix={handleRemix}
              />
            ))}
            {pending && <PendingThread pending={pending} />}
            {generationWarning && (
              <div className="generation-card rounded-[20px] px-4 py-3 font-codec text-sm text-primary">
                {generationWarning}
              </div>
            )}
          </section>
        )}

        {hasFeed && (
          <div
            id="audio-generator-composer"
            className="composer-dock-enter sticky bottom-0 z-20 -mx-4 mt-auto sm:-mx-6"
          >
            <div className="composer-dock-surface mx-auto max-w-[calc(100%-32px)] rounded-t-[24px] border-t border-[var(--ui-border-soft)] px-2 pb-0 pt-7 sm:max-w-4xl">
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onGenerate={handleGenerate}
                disabled={isGenerating}
                loading={isGenerating}
                generateLabel={isGenerating ? "Generating" : "Create"}
                mode={isPro ? "pro" : "lite"}
                layout="dock"
                controls={controls}
                activityChips={activityChips}
                onModeChange={(nextMode) => setMode(nextMode)}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function PromptControl({ label, value, options, onChange }: PromptControlConfig) {
  return (
    <div className="min-w-[136px] shrink-0">
      <div className="mb-1 px-1 font-codec text-[10px] font-semibold uppercase tracking-[0.04em] text-text/40">
        {label}
      </div>
      <BrandSelect
        value={value}
        options={options}
        onChange={onChange}
        className="min-w-[136px]"
      />
    </div>
  );
}

function QuickIdeas({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mt-6">
      <div className="mb-3 font-codec text-[13px] text-text/30">Try an idea →</div>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => {
              onPick(idea);
              const input = document.getElementById(COMPOSER_INPUT_ID);
              if (input instanceof HTMLTextAreaElement) {
                input.focus();
              }
            }}
            className="quick-chip px-[14px] py-[7px] font-codec text-[13px]"
          >
            {idea}
          </button>
        ))}
      </div>
    </div>
  );
}

function GenerationThread({
  batch,
  saved,
  onAddToLibrary,
  onRemix,
}: {
  batch: GenerationBatch;
  saved: Set<string>;
  onAddToLibrary: (item: AudioResult) => void;
  onRemix: (item: AudioResult) => void;
}) {
  return (
    <article className="space-y-3">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[70%] px-4 py-3 font-codec text-sm leading-6 text-text">
          {batch.prompt}
        </div>
      </div>
      <div className="generation-card rounded-[20px] p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-codec text-sm font-semibold text-text">Generation outputs</div>
            <div className="mt-1 font-mono text-[11px] text-text/45">
              {batch.type} / {batch.model} / {batch.format} / {batch.createdAt}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border-soft)] bg-[var(--ui-input)] px-3 py-1.5 font-codec text-[12px] text-text/55">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {batch.count} asset{batch.count > 1 ? "s" : ""}
          </div>
        </div>
        <div className="space-y-3">
          {batch.items.map((item, index) => (
            <div key={item.id} style={{ animationDelay: `${index * 80}ms` }}>
              <ResultCard
                item={toCardItem(item)}
                savedToLibrary={saved.has(item.id)}
                onAddToLibrary={() => onAddToLibrary(item)}
                onRemix={() => onRemix(item)}
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function PendingThread({ pending }: { pending: PendingGeneration }) {
  return (
    <article className="space-y-3">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[70%] px-4 py-3 font-codec text-sm leading-6 text-text">
          {pending.prompt}
        </div>
      </div>
      <div className="generation-card rounded-[20px] p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-codec text-sm font-semibold text-text">
              Generating {pending.type}
              <span className="generating-dots" aria-hidden>
                ...
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-text/45">
              {pending.stage} / {Math.round(pending.progress * 100)}%
            </div>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--ui-input)]">
            <div
              className="h-full rounded-full bg-[var(--ui-create-gradient)] transition-[width] duration-300"
              style={{ width: `${Math.max(8, Math.round(pending.progress * 100))}%` }}
            />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: pending.count }, (_, index) => (
            <div key={`${pending.id}-${index}`} className="rounded-[20px] border border-[var(--ui-border-soft)] bg-[var(--ui-input)] p-4">
              <div className="skeleton-line h-12 rounded-[14px]" />
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_90px]">
                <div className="skeleton-line h-3 rounded-full" />
                <div className="skeleton-line h-3 rounded-full" />
                <div className="skeleton-line h-3 rounded-full" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="skeleton-line h-9 w-20 rounded-full" />
                <div className="skeleton-line h-9 w-28 rounded-full" />
                <div className="skeleton-line h-9 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
