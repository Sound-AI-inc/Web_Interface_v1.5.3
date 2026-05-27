import { useEffect, useMemo, useState } from "react";
import { Clock3, MessageSquarePlus } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptInput from "../components/PromptInput";
import type { GenerationPreviewEntry } from "../components/ResultsList";
import IdeasMenu from "../components/IdeasMenu";
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
      setPrompt("");
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
    return history.find((batch) => batch.id === selectedBatchId) ?? history[0];
  }, [history, selectedBatchId]);

  const conversationBatches = useMemo(() => [...history].reverse(), [history]);
  const hasWorkspace = isGenerating || Boolean(generationEntries) || history.length > 0;

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

  const handleAddResource = () => {
    console.log("Open add audio/components flow");
  };

  const handleNewChat = () => {
    setPrompt("");
    setSelectedBatchId(null);
    document.getElementById("audio-generator-composer")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const openBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    document.getElementById(`batch-${batchId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <PageContainer
      title="Audio Generator"
      subtitle={hasWorkspace ? "Generations accumulate as a live creative thread." : ""}
      actions={
        <div className="rounded-card border-2 border-primary px-4 py-2 text-center">
          <div className="font-poppins text-[11px] font-medium text-text/60">Credits</div>
          <div className="font-poppins text-sm font-semibold text-text">42 remaining</div>
        </div>
      }
    >
      {hasWorkspace ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="ui-surface-2 h-fit rounded-[30px] p-4 xl:sticky xl:top-6">
            <button
              type="button"
              onClick={handleNewChat}
              className="ui-surface-1 ui-interactive flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left"
            >
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <div>
                <div className="font-poppins text-sm font-semibold text-text">New chat</div>
                <div className="font-codec text-[11px] text-text/54">
                  Start a fresh generation thread
                </div>
              </div>
            </button>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Clock3 className="h-4 w-4 text-primary" />
                <h2 className="font-poppins text-xs font-semibold uppercase tracking-[0.12em] text-text/58">
                  Chats
                </h2>
              </div>
              {history.length > 0 ? (
                <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-1">
                  {history.map((batch) => {
                    const selected = batch.id === activeBatch?.id;
                    return (
                      <button
                        key={batch.id}
                        type="button"
                        onClick={() => openBatch(batch.id)}
                        className={`rounded-[18px] px-3 py-3 text-left transition-colors ${
                          selected ? "ui-premium-border ui-surface-1" : "ui-surface-1 ui-interactive"
                        }`}
                      >
                        <div className="truncate font-poppins text-xs font-semibold text-text">
                          {batch.prompt}
                        </div>
                        <div className="mt-1 font-codec text-[11px] text-text/54">
                          {batch.type} - {batch.model}
                        </div>
                        <div className="mt-2 font-codec text-[10px] uppercase tracking-[0.1em] text-text/42">
                          {batch.createdAt}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="ui-surface-1 rounded-[18px] border border-dashed px-4 py-5 text-center">
                  <div className="font-poppins text-sm font-semibold text-text/72">No chats yet</div>
                  <div className="mt-1 font-codec text-[11px] text-text/50">
                    Your generation threads will appear here.
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {conversationBatches.map((batch) => (
                <article key={batch.id} id={`batch-${batch.id}`} className="space-y-3">
                  <div className="flex justify-end">
                    <div
                      className={`max-w-[78%] rounded-[26px] px-5 py-4 ${
                        batch.id === activeBatch?.id ? "ui-surface-2 ui-premium-border" : "ui-surface-1"
                      }`}
                    >
                      <div className="font-codec text-[15px] leading-7 text-text">{batch.prompt}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="ui-status-chip"><span className="ui-status-dot" />{batch.type}</span>
                        <span className="ui-status-chip"><span className="ui-status-dot" />{batch.model}</span>
                        <span className="ui-status-chip"><span className="ui-status-dot" />{batch.format}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ui-surface-2 rounded-[30px] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-poppins text-sm font-semibold text-text">Generation outputs</div>
                        <div className="mt-1 font-codec text-[11px] text-text/56">
                          {batch.count} synchronized result{batch.count > 1 ? "s" : ""} created on {batch.createdAt}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ui-status-chip"><span className="ui-status-dot" />Generation Synced</span>
                        <span className="ui-status-chip"><span className="ui-status-dot" />Metadata Aware</span>
                        <span className="ui-status-chip"><span className="ui-status-dot" />Multi-Format Active</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {batch.items.map((item) => (
                        <ResultCard
                          key={item.id}
                          item={toCardItem(item)}
                          savedToLibrary={saved.has(item.id)}
                          onAddToLibrary={() => handleAddToLibrary(item)}
                          onRemix={() => handleRemix(item)}
                        />
                      ))}
                    </div>
                  </div>
                </article>
              ))}

              {generationEntries && (
                <article className="space-y-3">
                  <div className="flex justify-end">
                    <div className="ui-surface-2 ui-premium-border max-w-[78%] rounded-[26px] px-5 py-4">
                      <div className="font-codec text-[15px] leading-7 text-text">{activeGenerationPrompt}</div>
                    </div>
                  </div>

                  <div className="ui-surface-2 rounded-[30px] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-poppins text-sm font-semibold text-text">Generation in progress</div>
                        <div className="mt-1 font-codec text-[11px] text-text/56">
                          {generationStage} - {Math.round(generationProgress * 100)}%
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="ui-status-chip"><span className="ui-status-dot" />Live Orchestration</span>
                        <span className="ui-status-chip"><span className="ui-status-dot" />Queued Outputs</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {generationEntries.map((entry, index) => {
                        if (!entry.item) {
                          return (
                            <PendingComposerCard
                              key={entry.id}
                              index={index}
                              progress={entry.progress}
                              stage={entry.status}
                            />
                          );
                        }

                        const item = entry.item;
                        return (
                          <ResultCard
                            key={entry.id}
                            item={toCardItem(item)}
                            savedToLibrary={saved.has(item.id)}
                            onAddToLibrary={() => handleAddToLibrary(item)}
                            onRemix={() => handleRemix(item)}
                            statusLabel={entry.status}
                            statusProgress={entry.progress}
                            disableActions
                          />
                        );
                      })}
                    </div>
                  </div>
                </article>
              )}
            </div>

            <div id="audio-generator-composer" className="sticky bottom-0 mt-6 pt-6">
              <div className="mx-auto w-full max-w-4xl rounded-t-[32px] bg-[linear-gradient(180deg,rgba(239,243,246,0)_0%,rgba(239,243,246,0.92)_26%,rgba(239,243,246,1)_100%)] px-2 pb-2 pt-8">
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  onGenerate={handleGenerate}
                  disabled={isGenerating}
                  loading={isGenerating}
                  generateLabel={isGenerating ? generationStage : "Create"}
                  modeLabel={isPro ? "Pro" : "Lite"}
                  mode={isPro ? "pro" : "lite"}
                  layout="dock"
                  intelligenceHint={
                    generationWarning ??
                    "The composer stays docked while results accumulate in the center thread."
                  }
                  onAdd={handleAddResource}
                  controls={
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      {promptControls.map((control) => (
                        <PromptControl key={control.label} {...control} compact />
                      ))}
                      <IdeasDock type={type as GenerationType} onPick={setPrompt} />
                    </div>
                  }
                />
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex h-full min-h-[72vh] flex-col items-center justify-center">
          <div className="w-full max-w-5xl px-4">
            <h1 className="text-center font-poppins text-5xl font-bold tracking-[-0.03em] text-text">
              Create your next sound
            </h1>
            <p className="mt-4 text-center font-codec text-[18px] text-text/62">
              Describe your next audio, MIDI, or preset idea
            </p>

            <div className="mx-auto mt-12 max-w-4xl rounded-[42px] ui-surface-2 p-6 md:p-7">
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onGenerate={handleGenerate}
                disabled={isGenerating}
                loading={isGenerating}
                generateLabel={isGenerating ? generationStage : "Create"}
                modeLabel={isPro ? "Pro" : "Lite"}
                mode={isPro ? "pro" : "lite"}
                layout="hero"
                intelligenceHint={
                  generationWarning ??
                  "The composer opens as a creative prompt surface, then docks itself below the thread after generation starts."
                }
                onAdd={handleAddResource}
                controls={
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {promptControls.map((control) => (
                      <PromptControl key={control.label} {...control} />
                    ))}
                    <IdeasDock type={type as GenerationType} onPick={setPrompt} />
                  </div>
                }
                activityChips={
                  <>
                    <span className="ui-status-chip"><span className="ui-status-dot" />Live Orchestration</span>
                    <span className="ui-status-chip"><span className="ui-status-dot" />Prompt Optimized</span>
                    <span className="ui-status-chip"><span className="ui-status-dot" />Metadata Aware</span>
                  </>
                }
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function PromptControl({
  label,
  value,
  options,
  onChange,
  compact = false,
}: PromptControlConfig & { compact?: boolean }) {
  return (
    <div
      className={`ui-surface-1 relative z-[900] min-w-[132px] rounded-[20px] px-3 py-2 ${
        compact ? "min-w-[120px]" : ""
      }`}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text/42">
        {label}
      </div>
      <BrandSelect
        value={value}
        options={options}
        onChange={onChange}
        className="min-w-[126px]"
      />
    </div>
  );
}

function IdeasDock({
  type,
  onPick,
}: {
  type: GenerationType;
  onPick: (text: string) => void;
}) {
  return (
    <div className="ui-surface-1 flex min-w-[118px] items-center justify-center rounded-[20px] px-3 py-2">
      <IdeasMenu onPick={onPick} type={type} />
    </div>
  );
}

function PendingComposerCard({
  index,
  progress,
  stage,
}: {
  index: number;
  progress: number;
  stage: string;
}) {
  return (
    <div className="ui-surface-1 rounded-[24px] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-poppins text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Draft {index + 1}
          </div>
          <div className="mt-1 font-codec text-sm text-text/64">{stage}</div>
        </div>
        <div className="ui-status-chip"><span className="ui-status-dot" />{Math.round(progress * 100)}%</div>
      </div>
      <div className="mt-4 overflow-hidden rounded-[18px] ui-surface-1 px-3 py-4">
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: 32 }, (_, barIndex) => (
            <div
              key={barIndex}
              className="w-full rounded-full bg-primary/15 transition-all duration-500"
              style={{
                height: `${16 + ((barIndex + index * 2) % 6) * 7}px`,
                opacity: barIndex / 32 < progress ? 1 : 0.32,
              }}
            />
          ))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-300"
            style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
