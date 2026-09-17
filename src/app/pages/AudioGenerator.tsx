import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, PanelRight, RefreshCw, Sparkles, X } from "lucide-react";
import PromptInput from "../components/PromptInput";
import BrandSelect from "../components/BrandSelect";
import type { AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import type { GenerationType } from "../lib/promptGeneration";
import { generateResults } from "../lib/generationGateway";
import ResultCard, { toCardItem } from "../components/ResultCard";
import SuggestionList, { type Suggestion } from "../components/workspace/SuggestionList";
import WorkspaceGreeting from "../components/workspace/WorkspaceGreeting";
import WorkspaceAssetPanel from "../components/workspace/WorkspaceAssetPanel";
import AddToProjectMenu from "../components/workspace/AddToProjectMenu";
import { consumeComposerPrefill } from "../lib/composerPrefill";
import { setEditorIntent } from "../lib/editorIntent";
import { COMPOSER_INPUT_ID, focusComposerInput } from "../lib/focusComposer";
import { useToast } from "../components/Toast";
import { recordGenerationHistory } from "../lib/creditsService";
import {
  estimateCost,
  fetchGenerationCostMap,
  type GenerationCostMap,
} from "../lib/generation/costs";
import { modelSelectOptions as catalogModelOptions } from "../lib/generation/models";
import { useLibraryStore } from "../state/libraryStore";
import {
  selectActiveChat,
  useWorkspaceStore,
  type GenerationBatch,
  type WorkspaceProject,
} from "../state/workspaceStore";
import { useLanguage } from "../i18n/LanguageProvider";
import { useCredits } from "../hooks/useCredits";
import { useAuth } from "../hooks/useAuth";

const LITE_TYPES = ["Audio Sample"] as const;
const LITE_FORMATS_BY_TYPE: Record<(typeof LITE_TYPES)[number], string[]> = {
  "Audio Sample": ["MP3"],
};

const PRO_TYPES = ["Audio Sample", "MIDI Melody", "VST Preset"] as const;
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

interface PendingGeneration {
  id: string;
  prompt: string;
  count: number;
  type: string;
  model: string;
  format: string;
  stage: string;
}

interface RunRequest {
  promptValue: string;
  genType: string;
  genModel: string;
  genFormat: string;
  genCount: number;
  parentBatchId?: string | null;
}

interface PromptControlConfig {
  label: string;
  value: string;
  options: string[];
  optionLabels?: { value: string; label?: string }[];
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

const BACKEND_GENERATED_FROM = new Set([
  "ai-orchestration-api",
  "soundcraft-api",
  "midicraft-api",
  "vstcraft-api",
]);

function mapSuggestionType(rec: Suggestion) {
  if (rec.type === "MIDI") return "MIDI Melody";
  if (rec.type === "VST Preset") return "VST Preset";
  return "Audio Sample";
}

/** UX-002: batches without an explicit source predate disclosure; infer from item metadata. */
function isDemoBatch(batch: GenerationBatch): boolean {
  if (batch.source === "demo") return true;
  if (batch.source === "backend") return false;
  if (batch.items.length === 0) return false;
  return batch.items.every(
    (item) => !BACKEND_GENERATED_FROM.has(item.metadata?.generatedFrom ?? ""),
  );
}

export default function AudioGenerator() {
  const navigate = useNavigate();
  const { mode } = useInterfaceMode();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPro = mode === "pro";

  const activeChatId = useWorkspaceStore((s) => s.activeChatId);
  const chats = useWorkspaceStore((s) => s.chats);
  const projects = useWorkspaceStore((s) => s.projects);
  const activeChat = useMemo(
    () => selectActiveChat({ chats, activeChatId }),
    [chats, activeChatId],
  );
  const updateChat = useWorkspaceStore((s) => s.updateChat);
  const appendBatch = useWorkspaceStore((s) => s.appendBatch);
  const createChat = useWorkspaceStore((s) => s.createChat);
  const pendingChatProjectId = useWorkspaceStore((s) => s.pendingChatProjectId);
  const createProject = useWorkspaceStore((s) => s.createProject);
  const assignAssetToProject = useWorkspaceStore((s) => s.assignAssetToProject);
  const assetsPanelCollapsed = useWorkspaceStore((s) => s.assetsPanelCollapsed);
  const setAssetsPanelCollapsed = useWorkspaceStore((s) => s.setAssetsPanelCollapsed);
  const addFromResult = useLibraryStore((s) => s.addFromResult);
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("projectId");
  // UX-018/019: synchronous in-flight guard (no re-render race between
  // click and Enter) + sequence invalidation for stale async completions.
  // The gateway exposes no AbortSignal, so cancellation means ignoring
  // stale results — backend idempotency is untouched.
  const inFlightRef = useRef(false);
  const generationSeq = useRef(0);

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

  const isFirstSessionMount = useRef(true);
  useEffect(() => {
    // Invalidate any in-flight generation from the previous chat context.
    generationSeq.current += 1;
    inFlightRef.current = false;
    if (isFirstSessionMount.current) {
      isFirstSessionMount.current = false;
      const prefill = consumeComposerPrefill();
      if (prefill?.prompt) {
        setPrompt(prefill.prompt);
        if (prefill.type && typeOptions.includes(prefill.type)) {
          setType(prefill.type);
        }
        focusComposerInput();
        return;
      }
    }
    setPrompt("");
    setPending(null);
    setGenerationWarning(null);
    focusComposerInput();
  }, [activeChatId, typeOptions]);

  // UX-013: hydrate project context from ?projectId= (direct links, refresh,
  // back/forward). Store remains the single source of truth; an explicitly
  // open chat from another project always wins over the parameter.
  useEffect(() => {
    if (!projectParam) return;
    const st = useWorkspaceStore.getState();
    if (!st.projects.some((p) => p.id === projectParam)) return;
    const chat = st.chats.find((c) => c.id === st.activeChatId);
    if (chat && chat.projectId && chat.projectId !== projectParam) return;
    if (!st.activeChatId) {
      if (st.pendingChatProjectId !== projectParam) st.startNewSession(projectParam);
    } else if (st.activeProjectId !== projectParam) {
      st.setActiveProject(projectParam);
    }
  }, [projectParam]);

  // Invalidate stale generations on unmount.
  useEffect(() => {
    return () => {
      generationSeq.current += 1;
      inFlightRef.current = false;
    };
  }, []);

  // P4-A §23: model lists + availability come from the catalog, not from
  // hardcoded provider assumptions in the UI.
  const { options: modelSelectOptions, availability: modelAvailability } = useMemo(
    () => catalogModelOptions(type as GenerationType, isPro ? "pro" : "lite"),
    [type, isPro],
  );
  const modelOptions = useMemo(
    () => modelSelectOptions.map((o) => String(o.value)),
    [modelSelectOptions],
  );

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
  const selectedModelInfo = modelAvailability[resolvedModel] ?? null;

  useEffect(() => {
    if (!modelOptions.includes(model)) setModel(modelOptions[0]);
  }, [modelOptions, model]);

  useEffect(() => {
    if (!formatOptions.includes(format)) setFormat(formatOptions[0]);
  }, [formatOptions, format]);

  const [pending, setPending] = useState<PendingGeneration | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  // P4-A §20: assets drawer for viewports below lg (desktop rail stays).
  const [assetsDrawerOpen, setAssetsDrawerOpen] = useState(false);
  useEffect(() => {
    if (!assetsDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssetsDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [assetsDrawerOpen]);

  const hasFeed = history.length > 0 || Boolean(pending);

  // P4-A §8–9: authoritative cost preview. Estimate only; the server charge
  // is final. Null map → "unavailable", never a guessed price.
  const { remaining: creditBalance, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const [costMap, setCostMap] = useState<GenerationCostMap | null>(null);
  const refreshCosts = useMemo(
    () => async () => {
      setCostMap(await fetchGenerationCostMap());
    },
    [],
  );
  useEffect(() => {
    void refreshCosts();
  }, [refreshCosts]);
  const costEstimate = useMemo(
    () => estimateCost(type as GenerationType, isPro ? "pro" : "lite", generationCount, costMap),
    [type, isPro, generationCount, costMap],
  );
  const insufficientCredits =
    !creditsLoading && costEstimate !== null && creditBalance < costEstimate.total;

  const promptControls: PromptControlConfig[] = useMemo(
    () => [
      { label: t("generator.type"), value: type, options: typeOptions, onChange: setType },
      {
        label: t("generator.model"),
        value: resolvedModel,
        options: modelSelectOptions.map((o) => o.value),
        optionLabels: modelSelectOptions,
        onChange: setModel,
      },
      {
        label: t("workspace.generations"),
        value: String(generationCount),
        options: GENERATION_COUNTS,
        onChange: (value: string) => setGenerationCount(Number(value)),
      },
      { label: t("generator.outputFormat"), value: resolvedFormat, options: formatOptions, onChange: setFormat },
    ],
    [t, type, typeOptions, resolvedModel, modelSelectOptions, generationCount, resolvedFormat, formatOptions],
  );

  const patchChatIds = (field: "favoriteIds" | "savedIds", id: string) => {
    if (!activeChat || !activeChatId) return;
    const current = new Set(activeChat[field]);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    updateChat(activeChatId, { [field]: [...current] });
  };

  const ensureActiveChat = (): string => {
    if (activeChatId && chats.some((c) => c.id === activeChatId)) {
      return activeChatId;
    }
    const projectId = pendingChatProjectId;
    const id = createChat(projectId ?? null);
    useWorkspaceStore.setState({ pendingChatProjectId: null });
    return id;
  };

  const handleSaveToLibrary = (item: AudioResult) => {
    addFromResult(item);
    patchChatIds("savedIds", item.id);
  };

  const handleAddToProject = (item: AudioResult, projectId: string) => {
    addFromResult(item);
    assignAssetToProject(projectId, item.id);
    patchChatIds("savedIds", item.id);
  };

  const handleCreateProjectForAsset = (item: AudioResult) => {
    const projectId = createProject("New Project");
    handleAddToProject(item, projectId);
  };

  const handleEditInEditor = (item: AudioResult) => {
    setEditorIntent({
      assetId: item.id,
      kind: item.kind,
      title: item.title,
      chatId: activeChatId || undefined,
      projectId: activeChat?.projectId ?? undefined,
    });
    navigate("/app/editor");
  };

  const handleRemix = (item: AudioResult, batchPrompt?: string) => {
    const base = batchPrompt ?? prompt;
    setPrompt(
      base
        ? `${base} — make ${item.title} harder and more aggressive`
        : `Make ${item.title} harder and more aggressive`,
    );
    focusComposerInput();
  };

  const handleCancelGeneration = () => {
    if (!inFlightRef.current) return;
    generationSeq.current += 1;
    inFlightRef.current = false;
    setPending(null);
    setIsGenerating(false);
    notify("Generation cancelled.", "info");
  };

  const handleRegenerate = (batch: GenerationBatch) => {
    // P4-A §12: a real generation request (new id, lineage preserved),
    // not a prompt refill.
    void runGeneration({
      promptValue: batch.prompt,
      genType: batch.type,
      genModel: batch.model,
      genFormat: batch.format,
      genCount: batch.count,
      parentBatchId: batch.id,
    });
  };

  const handleSuggestion = (rec: Suggestion) => {
    setPrompt(rec.prompt);
    setType(mapSuggestionType(rec));
    focusComposerInput();
  };

  const runGeneration = async (req: RunRequest): Promise<boolean> => {
    // UX-018/019: synchronous guard first — state updates are async, so
    // isGenerating alone cannot stop a click+Enter race in the same tick.
    if (inFlightRef.current || isGenerating) return false;

    // P4-A §8–9: cost gate from the authoritative map. Estimate only —
    // the server remains the final authority and enforces on request.
    const estimate = estimateCost(
      req.genType as GenerationType,
      isPro ? "pro" : "lite",
      req.genCount,
      costMap,
    );
    if (!creditsLoading && estimate && creditBalance < estimate.total) {
      const blocked =
        `Not enough credits — this generation needs ~${estimate.total} credits ` +
        `(balance ${creditBalance}). Top up in Billing to continue.`;
      setGenerationWarning(blocked);
      notify(blocked, "error");
      return false;
    }

    // No client-side credit pre-check beyond the estimate gate: the server
    // enforces entitlements and reserves credits atomically.
    inFlightRef.current = true;
    const seq = generationSeq.current;
    const pendingId = crypto.randomUUID();
    setIsGenerating(true);
    setGenerationWarning(null);
    setPending({
      id: pendingId,
      prompt: req.promptValue,
      count: req.genCount,
      type: req.genType,
      model: req.genModel,
      format: req.genFormat,
      stage: GENERATION_STAGES[0],
    });

    const startedAt = Date.now();
    // Indeterminate: generic stage rotation, no fabricated percentages.
    const stageTimer = window.setInterval(() => {
      setPending((current) => {
        if (!current) return current;
        const idx = GENERATION_STAGES.indexOf(current.stage as (typeof GENERATION_STAGES)[number]);
        const next = GENERATION_STAGES[Math.min(idx + 1, GENERATION_STAGES.length - 1)];
        return { ...current, stage: next };
      });
    }, 900);

    try {
      const response = await generateResults({
        prompt: req.promptValue,
        mode: isPro ? "pro" : "lite",
        type: req.genType as GenerationType,
        model: req.genModel,
        format: req.genFormat,
        count: req.genCount,
        idempotencyKey: pendingId,
      });

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_GENERATION_VISUAL_MS) {
        await sleep(MIN_GENERATION_VISUAL_MS - elapsed);
      }

      // Stale completion (chat switched, cancelled, or unmounted): ignore.
      if (seq !== generationSeq.current) {
        window.clearInterval(stageTimer);
        return false;
      }

      setGenerationWarning(response.warning ?? null);
      const isPreview = response.source === "demo";
      const batch: GenerationBatch = {
        id: pendingId,
        prompt: req.promptValue,
        count: req.genCount,
        type: req.genType,
        model: req.genModel,
        format: req.genFormat,
        createdAt: formatBatchTimestamp(new Date()),
        items: response.items,
        source: response.source,
        status: isPreview ? "preview" : "completed",
        parentBatchId: req.parentBatchId ?? null,
      };

      const actualCount = Math.max(1, response.items.length);

      // Backend-confirmed balance: always refresh from /api/credits after generation.
      void refreshCredits();
      void refreshCosts();

      if (actualCount < req.genCount) {
        setGenerationWarning(
          (response.warning ? `${response.warning} ` : "") +
            `Requested ${req.genCount} variants; received ${actualCount}. Credits charged: ${response.credits?.consumed ?? 0}.`,
        );
      }

      const chatId = ensureActiveChat();
      appendBatch(chatId, batch, response.items);
      const createdChat = useWorkspaceStore.getState().chats.find((c) => c.id === chatId);
      void recordGenerationHistory({
        userId: user?.id ?? null,
        projectId: createdChat?.projectId ?? null,
        generationId: pendingId,
        prompt: req.promptValue,
        generationType: req.genType,
        model: req.genModel,
        format: req.genFormat,
        count: actualCount,
        creditsSpent: response.credits?.consumed ?? 0,
        status: "success",
      });
      setPrompt("");
      setPending(null);
      return true;
    } catch (error) {
      if (seq !== generationSeq.current) {
        window.clearInterval(stageTimer);
        return false;
      }
      // Server restores credits on failure automatically; refresh authoritative state.
      void refreshCredits();
      const message = error instanceof Error ? error.message : "Generation failed unexpectedly.";
      // P4-A §17: failure is a first-class timeline entry with Retry — not
      // a transient warning. No restore claim beyond server-confirmed state.
      const failedBatch: GenerationBatch = {
        id: pendingId,
        prompt: req.promptValue,
        count: req.genCount,
        type: req.genType,
        model: req.genModel,
        format: req.genFormat,
        createdAt: formatBatchTimestamp(new Date()),
        items: [],
        source: "backend",
        status: "failed",
        error: message,
        parentBatchId: req.parentBatchId ?? null,
      };
      appendBatch(ensureActiveChat(), failedBatch, []);
      setGenerationWarning(message);
      notify(message, "error");
      setPending(null);
      return false;
    } finally {
      window.clearInterval(stageTimer);
      inFlightRef.current = false;
      if (seq === generationSeq.current) setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (prompt.trim().length < 3) return;
    void runGeneration({
      promptValue: prompt.trim(),
      genType: type,
      genModel: resolvedModel,
      genFormat: resolvedFormat,
      genCount: generationCount,
    });
  };

  const handleDownload = (item: AudioResult) => {
    // P4-A §11: real bytes download; otherwise an honest unavailable message.
    const url = item.metadata?.previewUrl ?? item.metadata?.assetUrl ?? null;
    if (!url) {
      notify("Preview unavailable — inference service not connected.", "error");
      return;
    }
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${item.title}.${(item.format || "bin").toLowerCase().replace(/[^a-z0-9]+/g, "") || "bin"}`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      notify("Download started.", "success");
    } catch {
      notify("Download failed — try again.", "error");
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
    <div className="prompt-dock-wrap" data-state={hasFeed ? "docked" : "centered"}>
      <CostPreviewLine
        estimate={costEstimate}
        balance={creditBalance}
        loading={creditsLoading}
        count={generationCount}
        typeLabel={type}
      />
      {selectedModelInfo && !selectedModelInfo.available && (
        <p
          className="mx-auto mb-2 w-fit rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1 font-codec text-[11px] text-[var(--text-secondary)]"
          role="note"
        >
          {selectedModelInfo.id} endpoint not connected — output will be labelled Preview.
        </p>
      )}
      <PromptInput
        value={prompt}
        onChange={setPrompt}
        onGenerate={handleGenerate}
        disabled={isGenerating || insufficientCredits}
        loading={isGenerating}
        generateLabel={isGenerating ? t("workspace.generating") : t("workspace.create")}
        mode={isPro ? "pro" : "lite"}
        layout="dock"
        controls={controls}
        textareaId={COMPOSER_INPUT_ID}
        placeholder={
          hasFeed
            ? "Describe a variation or refinement… (Shift+Enter for newline)"
            : undefined
        }
      />
      {insufficientCredits && costEstimate && (
        <p className="mx-auto mt-2 w-fit font-codec text-[12px] text-[var(--error)]" role="alert">
          Not enough credits — this needs ~{costEstimate.total} credits.{" "}
          <button type="button" className="underline" onClick={() => navigate("/app/billing")}>
            View plans
          </button>
        </p>
      )}
    </div>
  );

  return (
    <div className="workspace-layout relative flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section className="workspace-conversation relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {!hasFeed ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6">
              <WorkspaceGreeting />
              {dock}
              <div className="mt-6 w-full max-w-xl px-2">
                <SuggestionList onSelect={handleSuggestion} />
              </div>
              {generationWarning && (
                <p className="mt-4 font-codec text-sm text-primary">{generationWarning}</p>
              )}
            </div>
          ) : (
            <>
              <div className="token-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="feed-enter mx-auto flex w-full max-w-4xl flex-col gap-8 pb-4">
                  {history.map((batch) => (
                    <GenerationTimeline
                      key={batch.id}
                      batch={batch}
                      saved={savedIds}
                      favorites={favoriteIds}
                      projects={projects}
                      onSaveToLibrary={handleSaveToLibrary}
                      onAddToProject={handleAddToProject}
                      onCreateProjectForAsset={handleCreateProjectForAsset}
                      onToggleFavorite={(id) => patchChatIds("favoriteIds", id)}
                      onRemix={(item) => handleRemix(item, batch.prompt)}
                      onEditInEditor={handleEditInEditor}
                      onDownload={handleDownload}
                      onRegenerate={() => handleRegenerate(batch)}
                      onRetry={() => handleRegenerate(batch)}
                    />
                  ))}
                  {pending && <PendingTimeline pending={pending} onCancel={handleCancelGeneration} />}
                  {generationWarning && (
                    <div className="generation-card rounded-[20px] px-4 py-3 font-codec text-sm text-primary">
                      {generationWarning}
                    </div>
                  )}
                </div>
              </div>
              <div
                id="audio-generator-composer"
                className="workspace-dock composer-dock-enter shrink-0 border-t border-[var(--border-primary)] px-4 pb-3 pt-2 sm:px-6"
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
      {/* Mobile/tablet assets entry point (desktop uses the rail). */}
      <button
        type="button"
        onClick={() => setAssetsDrawerOpen(true)}
        aria-label={`Open assets panel, ${sessionAssets.length} assets`}
        className="composer-control absolute bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full !rounded-full lg:hidden"
      >
        <PanelRight className="h-5 w-5" />
        {sessionAssets.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-codec text-[10px] font-bold text-on-accent">
            {sessionAssets.length}
          </span>
        )}
      </button>
      {assetsDrawerOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Session assets">
          <button
            type="button"
            aria-label="Close assets panel"
            onClick={() => setAssetsDrawerOpen(false)}
            className="absolute inset-0 bg-[var(--scrim)]"
          />
          <div className="absolute inset-y-0 right-0 flex w-[340px] max-w-[88vw] flex-col border-l border-[var(--border-primary)] bg-[var(--background-secondary)] shadow-[var(--ui-shadow-floating)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] px-3 py-2">
              <span className="px-1 font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Assets
              </span>
              <button
                type="button"
                onClick={() => setAssetsDrawerOpen(false)}
                aria-label="Close assets panel"
                className="composer-control flex h-8 w-8 items-center justify-center rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <WorkspaceAssetPanel
                sessionAssets={sessionAssets}
                favoriteIds={favoriteIds}
                onToggleFavorite={(id) => patchChatIds("favoriteIds", id)}
                collapsed={false}
                onToggleCollapsed={() => setAssetsDrawerOpen(false)}
                forceVisible
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CostPreviewLine({
  estimate,
  balance,
  loading,
  count,
  typeLabel,
}: {
  estimate: { unit: number; total: number } | null;
  balance: number;
  loading: boolean;
  count: number;
  typeLabel: string;
}) {
  return (
    <div
      className="mx-auto mb-2 flex w-fit flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-codec text-[11px] text-[var(--text-muted)]"
      aria-live="polite"
    >
      {loading ? (
        <span>Checking credit cost…</span>
      ) : estimate ? (
        <>
          <span>
            {count} × {estimate.unit} credits
          </span>
          <span aria-hidden>·</span>
          <span className="font-semibold text-[var(--text-secondary)]">
            Cost ~{estimate.total} credits (estimate)
          </span>
          <span aria-hidden>·</span>
          <span>
            Balance {balance} → after ~{Math.max(0, balance - estimate.total)}
          </span>
          <span className="w-full text-center text-[10px]" title="Server-computed unit cost; final charge is server-authoritative">
            {typeLabel} · server unit cost, final charge confirmed after generation
          </span>
        </>
      ) : (
        <span>Credit cost unavailable — balance shown in header.</span>
      )}
    </div>
  );
}

function PromptControl({ label, value, options, optionLabels, onChange }: PromptControlConfig) {
  return (
    <div className="min-w-[124px] shrink-0">
      <div className="mb-0.5 px-1 font-codec text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">
        {label}
      </div>
      <BrandSelect
        value={value}
        options={optionLabels ?? options}
        onChange={onChange}
        className="min-w-[124px]"
      />
    </div>
  );
}

function GenerationTimeline({
  batch,
  saved,
  favorites,
  projects,
  onSaveToLibrary,
  onAddToProject,
  onCreateProjectForAsset,
  onToggleFavorite,
  onRemix,
  onEditInEditor,
  onDownload,
  onRegenerate,
  onRetry,
}: {
  batch: GenerationBatch;
  saved: Set<string>;
  favorites: Set<string>;
  projects: WorkspaceProject[];
  onSaveToLibrary: (item: AudioResult) => void;
  onAddToProject: (item: AudioResult, projectId: string) => void;
  onCreateProjectForAsset: (item: AudioResult) => void;
  onToggleFavorite: (id: string) => void;
  onRemix: (item: AudioResult) => void;
  onEditInEditor: (item: AudioResult) => void;
  onDownload: (item: AudioResult) => void;
  onRegenerate: () => void;
  onRetry: () => void;
}) {
  const label =
    batch.type === "Audio Sample"
      ? `${batch.count} Audio Sample${batch.count > 1 ? "s" : ""} Generated`
      : batch.type === "MIDI Melody"
        ? `${batch.count} MIDI File${batch.count > 1 ? "s" : ""} Generated`
        : `${batch.count} VST Preset${batch.count > 1 ? "s" : ""} Generated`;
  // UX-002: demo fallback must never look like a production render.
  const isPreview = batch.status === "preview" || (batch.status !== "failed" && isDemoBatch(batch));
  const isFailed = batch.status === "failed";

  if (isFailed) {
    return (
      <article className="space-y-5">
        <div className="flex justify-end">
          <div className="user-bubble max-w-[85%] px-4 py-3 font-codec text-sm leading-6 text-[var(--text-primary)]">
            {batch.prompt}
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="assistant-bubble premium-generation-bubble w-full max-w-full md:max-w-[92%] rounded-[20px] border border-[var(--error)]/30 bg-[var(--surface-primary)] p-5"
            role="alert"
          >
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <div className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                SoundAI
              </div>
              <span className="timeline-status" data-state="loading">
                <X className="h-3 w-3" />
                Generation failed
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {batch.model} · {batch.format}
              </span>
            </div>
            <p className="font-codec text-[13px] leading-6 text-[var(--text-primary)]">
              {batch.error ?? "The generation service is currently unavailable."}
            </p>
            <p className="mt-1 font-codec text-[12px] leading-5 text-[var(--text-secondary)]">
              Your balance was refreshed from the server — failed generations are not charged.
            </p>
            <div className="mt-4">
              <TimelineAction icon={RefreshCw} label="Retry" onClick={onRetry} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-5">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[85%] px-4 py-3 font-codec text-sm leading-6 text-[var(--text-primary)]">
          {batch.prompt}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="assistant-bubble premium-generation-bubble w-full max-w-full md:max-w-[92%]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              SoundAI
            </div>
            <span className="timeline-status">
              <Check className="h-3 w-3" />
              {label}
            </span>
            {isPreview && (
              <span
                className="timeline-status"
                data-state="loading"
                title="Preview mode — demo synthesis, not a production render."
              >
                Preview
              </span>
            )}
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {batch.model} · {batch.format}
            </span>
            <TimelineAction icon={RefreshCw} label="Regenerate" onClick={onRegenerate} />
          </div>
          {isPreview && (
            <p className="mb-4 font-codec text-[12px] leading-5 text-[var(--text-secondary)]">
              Preview mode — demo synthesis, not a production render. Downloads and
              exports from this batch are preview-quality.
            </p>
          )}
          <div className="space-y-6">
            {batch.items.map((item, index) => (
              <div key={item.id} style={{ animationDelay: `${index * 80}ms` }}>
                <ResultCard
                  item={toCardItem(item)}
                  variant="feed"
                  savedToLibrary={saved.has(item.id)}
                  favorited={favorites.has(item.id)}
                  onAddToLibrary={() => onSaveToLibrary(item)}
                  onToggleFavorite={() => onToggleFavorite(item.id)}
                  onRemix={() => onRemix(item)}
                  onEdit={() => onEditInEditor(item)}
                  onDownload={() => onDownload(item)}
                  saveLabel={saved.has(item.id) ? "Saved" : "Save to Library"}
                  footer={
                    <AddToProjectMenu
                      projects={projects}
                      onAssign={(projectId) => onAddToProject(item, projectId)}
                      onCreateProject={() => onCreateProjectForAsset(item)}
                    />
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PendingTimeline({ pending, onCancel }: { pending: PendingGeneration; onCancel: () => void }) {
  return (
    <article className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex justify-end">
        <div className="user-bubble max-w-[85%] px-4 py-3 font-codec text-sm leading-6 text-[var(--text-primary)]">
          {pending.prompt}
        </div>
      </div>
      <div className="flex justify-start">
        <div className="assistant-bubble premium-generation-bubble max-w-full space-y-4 md:max-w-[95%]">
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
                {pending.stage}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="timeline-status" data-state="loading">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                In progress
              </span>
              <TimelineAction icon={X} label="Cancel" onClick={onCancel} />
            </div>
          </div>
          {/* Indeterminate: exact inference progress is unknown — no fabricated %. */}
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]"
            role="progressbar"
            aria-label={`Generating ${pending.type.toLowerCase()}`}
          >
            <div className="skeleton-line h-full w-full rounded-full" />
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
