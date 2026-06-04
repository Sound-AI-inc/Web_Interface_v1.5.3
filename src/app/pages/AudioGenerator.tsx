import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, RefreshCw, Sparkles } from "lucide-react";
import PromptInput from "../components/PromptInput";
import BrandSelect from "../components/BrandSelect";
import type { AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import type { GenerationType } from "../lib/promptGeneration";
import { generateResults } from "../lib/generationGateway";
import ResultCard, { toCardItem } from "../components/ResultCard";
import TypewriterPlaceholder from "../components/workspace/TypewriterPlaceholder";
import RecommendationCards, { type Recommendation } from "../components/workspace/RecommendationCards";
import WorkspaceAssetPanel from "../components/workspace/WorkspaceAssetPanel";
import {
  selectActiveChat,
  useWorkspaceStore,
  type GenerationBatch,
} from "../state/workspaceStore";

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
const MIN_GENERATION_VISUAL_MS = 1800;
const COMPOSER_INPUT_ID = "generator-composer-input";

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

function mapRecommendationType(rec: Recommendation) {
  if (rec.type === "MIDI") return "MIDI Melody";
  if (rec.type === "VST Preset") return "VST Preset";
  return "Audio Sample";
}

export default function AudioGenerator() {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const activeChatId = useWorkspaceStore((s) => s.activeChatId);
  const chats = useWorkspaceStore((s) => s.chats);
  const activeChat = useMemo(
    () => selectActiveChat({ chats, activeChatId }),
    [chats, activeChatId],
  );
  const updateChat = useWorkspaceStore((s) => s.updateChat);
  const appendBatch = useWorkspaceStore((s) => s.appendBatch);
  const createChat = useWorkspaceStore((s) => s.createChat);
  const setActiveChat = useWorkspaceStore((s) => s.setActiveChat);
  const assetsPanelCollapsed = useWorkspaceStore((s) => s.assetsPanelCollapsed);
  const setAssetsPanelCollapsed = useWorkspaceStore((s) => s.setAssetsPanelCollapsed);

  useEffect(() => {
    if (chats.length === 0) {
      createChat();
      return;
    }
    if (!chats.some((c) => c.id === activeChatId)) {
      setActiveChat(chats[0].id);
    }
  }, [chats, activeChatId, createChat, setActiveChat]);

  const history = activeChat?.history ?? [];
  const sessionAssets = activeChat?.sessionAssets ?? [];
  const favoriteIds = useMemo(() => new Set(activeChat?.favoriteIds ?? []), [activeChat?.favoriteIds]);
  const savedIds = useMemo(() => new Set(activeChat?.savedIds ?? []), [activeChat?.savedIds]);

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

  useEffect(() => {
    setPrompt("");
    setPending(null);
    setGenerationWarning(null);
  }, [activeChatId]);

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

  const patchChatIds = (field: "favoriteIds" | "savedIds", id: string) => {
    if (!activeChat) return;
    const current = new Set(activeChat[field]);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    updateChat(activeChatId, { [field]: [...current] });
  };

  const handleRemix = (item: AudioResult, batchPrompt?: string) => {
    const base = batchPrompt ?? prompt;
    setPrompt(
      base
        ? `${base} — make ${item.title} harder and more aggressive`
        : `Make ${item.title} harder and more aggressive`,
    );
    document.getElementById(COMPOSER_INPUT_ID)?.focus();
  };

  const handleRegenerate = (batch: GenerationBatch) => {
    setPrompt(batch.prompt);
    document.getElementById(COMPOSER_INPUT_ID)?.focus();
  };

  const handleRecommendation = (rec: Recommendation) => {
    setPrompt(rec.prompt);
    setType(mapRecommendationType(rec));
    document.getElementById(COMPOSER_INPUT_ID)?.focus();
  };

  const handleGenerate = async () => {
    if (isGenerating || prompt.trim().length < 3 || !activeChat) return;

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
      const batch: GenerationBatch = {
        id: pendingId,
        prompt: promptValue,
        count: generationCount,
        type,
        model: resolvedModel,
        format: resolvedFormat,
        createdAt: formatBatchTimestamp(new Date()),
        items: response.items,
      };

      appendBatch(activeChatId, batch, response.items);
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

  const dock = (
    <div
      className="prompt-dock-wrap"
      data-state={hasFeed ? "docked" : "centered"}
    >
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
        textareaId={COMPOSER_INPUT_ID}
      />
    </div>
  );

  return (
    <div className="workspace-layout flex h-[calc(100vh-64px)] flex-col">
      <div className="flex min-h-0 flex-1">
        <section className="workspace-conversation relative flex min-w-0 flex-1 flex-col">
          {!hasFeed ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
              <h1 className="generator-hero-title mb-2 font-syne text-[32px] font-bold tracking-[-0.03em] sm:text-[40px]">
                What do you want to create?
              </h1>
              <p className="mb-8 max-w-md text-center font-codec text-[15px] text-[var(--text-secondary)]">
                Describe your idea — SoundAI will generate production-ready assets.
              </p>
              {dock}
              <div className="mt-8 w-full max-w-2xl px-2">
                <div className="mb-4 rounded-[12px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3">
                  <TypewriterPlaceholder />
                </div>
                <RecommendationCards onSelect={handleRecommendation} />
              </div>
              {generationWarning && (
                <p className="mt-4 font-codec text-sm text-primary">{generationWarning}</p>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="feed-enter mx-auto flex w-full max-w-4xl flex-col gap-8 pb-6">
                  {history.map((batch) => (
                    <GenerationTimeline
                      key={batch.id}
                      batch={batch}
                      saved={savedIds}
                      favorites={favoriteIds}
                      onAddToLibrary={(item) => patchChatIds("savedIds", item.id)}
                      onToggleFavorite={(id) => patchChatIds("favoriteIds", id)}
                      onRemix={(item) => handleRemix(item, batch.prompt)}
                      onRegenerate={() => handleRegenerate(batch)}
                    />
                  ))}
                  {pending && <PendingTimeline pending={pending} />}
                  {generationWarning && (
                    <div className="generation-card rounded-[20px] px-4 py-3 font-codec text-sm text-primary">
                      {generationWarning}
                    </div>
                  )}
                </div>
              </div>
              <div
                id="audio-generator-composer"
                className="workspace-dock composer-dock-enter shrink-0 border-t border-[var(--border-primary)] px-4 pb-4 pt-3 sm:px-6"
              >
                {dock}
              </div>
            </>
          )}
        </section>

        <WorkspaceAssetPanel
          sessionAssets={sessionAssets}
          favoriteIds={favoriteIds}
          onToggleFavorite={(id) => patchChatIds("favoriteIds", id)}
          collapsed={assetsPanelCollapsed}
          onToggleCollapsed={() => setAssetsPanelCollapsed(!assetsPanelCollapsed)}
        />
      </div>
    </div>
  );
}

function PromptControl({ label, value, options, onChange }: PromptControlConfig) {
  return (
    <div className="min-w-[136px] shrink-0">
      <div className="mb-1 px-1 font-codec text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">
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

function GenerationTimeline({
  batch,
  saved,
  favorites,
  onAddToLibrary,
  onToggleFavorite,
  onRemix,
  onRegenerate,
}: {
  batch: GenerationBatch;
  saved: Set<string>;
  favorites: Set<string>;
  onAddToLibrary: (item: AudioResult) => void;
  onToggleFavorite: (id: string) => void;
  onRemix: (item: AudioResult) => void;
  onRegenerate: () => void;
}) {
  const label =
    batch.type === "Audio Sample"
      ? `${batch.count} Audio Sample${batch.count > 1 ? "s" : ""} Generated`
      : batch.type === "MIDI Melody"
        ? `${batch.count} MIDI File${batch.count > 1 ? "s" : ""} Generated`
        : `${batch.count} VST Preset${batch.count > 1 ? "s" : ""} Generated`;

  return (
    <article className="space-y-4">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[85%] px-4 py-3 font-codec text-sm leading-6 text-[var(--text-primary)]">
          {batch.prompt}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="assistant-bubble max-w-full space-y-4 md:max-w-[95%]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-codec text-sm font-semibold text-[var(--text-primary)]">
                SoundAI
              </div>
              <div className="mt-1 font-codec text-[13px] text-[var(--text-secondary)]">{label}</div>
              <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                {batch.model} · {batch.format} · {batch.createdAt}
              </div>
            </div>
            <span className="timeline-status">
              <Check className="h-3 w-3" />
              Completed
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <TimelineAction icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
          </div>
          <div className="space-y-3">
            {batch.items.map((item, index) => (
              <div key={item.id} className="asset-enter" style={{ animationDelay: `${index * 80}ms` }}>
                <ResultCard
                  item={toCardItem(item)}
                  savedToLibrary={saved.has(item.id)}
                  onAddToLibrary={() => onAddToLibrary(item)}
                  onRemix={() => onRemix(item)}
                />
                <div className="mt-2 flex flex-wrap gap-2 pl-1">
                  <TimelineAction icon={Pencil} label="Edit" onClick={() => onRemix(item)} />
                  {favorites.has(item.id) ? (
                    <span className="font-codec text-[11px] text-primary">Favorited</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(item.id)}
                      className="font-codec text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Favorite
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PendingTimeline({ pending }: { pending: PendingGeneration }) {
  return (
    <article className="space-y-4">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[85%] px-4 py-3 font-codec text-sm leading-6 text-[var(--text-primary)]">
          {pending.prompt}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="assistant-bubble max-w-full space-y-4 md:max-w-[95%]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-codec text-sm font-semibold text-[var(--text-primary)]">
                SoundAI
              </div>
              <div className="mt-1 font-codec text-[13px] text-[var(--text-secondary)]">
                Generating {pending.type.toLowerCase()}
                <span className="generating-dots" aria-hidden>
                  ...
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
                {pending.stage} · {Math.round(pending.progress * 100)}%
              </div>
            </div>
            <span className="timeline-status" data-state="loading">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              In progress
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <div
              className="h-full rounded-full bg-[var(--ui-create-gradient)] transition-[width] duration-300"
              style={{ width: `${Math.max(8, Math.round(pending.progress * 100))}%` }}
            />
          </div>
          <div className="space-y-3">
            {Array.from({ length: pending.count }, (_, index) => (
              <div
                key={`${pending.id}-${index}`}
                className="rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4"
              >
                <div className="skeleton-line h-12 rounded-[14px]" />
                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_90px]">
                  <div className="skeleton-line h-3 rounded-full" />
                  <div className="skeleton-line h-3 rounded-full" />
                  <div className="skeleton-line h-3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function TimelineAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof RefreshCw;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="composer-control inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-codec text-[11px] font-semibold"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
