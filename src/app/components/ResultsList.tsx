import { useMemo, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import ResultCard, { toCardItem } from "./ResultCard";
import type { AudioResult } from "../data/mock";

export interface GenerationPreviewEntry {
  id: string;
  status: string;
  progress: number;
  item?: AudioResult;
}

interface ResultsListProps {
  items: AudioResult[];
  title?: string;
  savedIds?: Set<string>;
  onAddToLibrary?: (item: AudioResult) => void;
  onRemix?: (item: AudioResult) => void;
  initialVisible?: number;
  isGenerating?: boolean;
  generationProgress?: number;
  generationStage?: string;
  generationPrompt?: string;
  generationType?: string;
  generationEntries?: GenerationPreviewEntry[] | null;
}

export default function ResultsList({
  items,
  title = "AudioResults",
  savedIds,
  onAddToLibrary,
  onRemix,
  initialVisible = 3,
  isGenerating = false,
  generationProgress = 0,
  generationStage,
  generationPrompt,
  generationType,
  generationEntries,
}: ResultsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = useMemo(() => {
    if (expanded || items.length <= initialVisible) return items;
    return items.slice(0, initialVisible);
  }, [expanded, initialVisible, items]);

  const usingGenerationEntries = Boolean(generationEntries && generationEntries.length > 0);
  const liveGenerationEntries = generationEntries ?? [];

  return (
    <section className="rounded-card border border-primary/40 p-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-poppins text-sm font-semibold text-text">{title}</h2>
          {usingGenerationEntries && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-poppins text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
              <LoaderCircle className="h-3 w-3 animate-spin" />
              {generationStage ?? "Generating"}
            </span>
          )}
        </div>
        {usingGenerationEntries ? (
          <span className="app-meta">{Math.round(generationProgress * 100)}% complete</span>
        ) : items.length > initialVisible ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="font-poppins text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        ) : (
          <span className="app-meta">{items.length} results</span>
        )}
      </header>

      {usingGenerationEntries ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-card border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-poppins text-sm font-semibold text-text">
                    AI generation in progress
                  </p>
                </div>
                <p className="app-meta mt-1 truncate">
                  {generationType ?? "Audio"} · {generationPrompt?.trim() || "Preparing your prompt"} · {liveGenerationEntries.length} result{liveGenerationEntries.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="w-32 shrink-0">
                <div className="h-2 overflow-hidden rounded-full bg-white/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-300"
                    style={{ width: `${Math.max(8, Math.round(generationProgress * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {liveGenerationEntries.map((entry, index) => {
            if (!entry.item) {
              return (
                <PendingResultCard
                  key={entry.id}
                  index={index}
                  progress={entry.progress}
                  stage={entry.status}
                />
              );
            }

            const item = entry.item;
            return (
              <div
                key={entry.id}
                className="animate-[fadeInUp_420ms_ease-out]"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <ResultCard
                  item={toCardItem(item)}
                  savedToLibrary={savedIds?.has(item.id)}
                  onAddToLibrary={() => onAddToLibrary?.(item)}
                  onRemix={() => onRemix?.(item)}
                  statusLabel={entry.status}
                  statusProgress={entry.progress}
                  disableActions={isGenerating}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleItems.map((item) => (
            <ResultCard
              key={item.id}
              item={toCardItem(item)}
              savedToLibrary={savedIds?.has(item.id)}
              onAddToLibrary={() => onAddToLibrary?.(item)}
              onRemix={() => onRemix?.(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface PendingResultCardProps {
  index: number;
  progress: number;
  stage: string;
}

function PendingResultCard({ index, progress, stage }: PendingResultCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-primary/15 bg-white/85 p-4 shadow-flat-sm">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-poppins text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
              Draft {index + 1}
            </span>
            <div className="h-4 w-40 animate-pulse rounded-full bg-surface-muted" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="font-codec text-xs italic text-text/55">{stage}</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-card border border-surface bg-surface-muted/80 p-3">
            <div className="mb-3 flex gap-1">
              {Array.from({ length: 28 }, (_, barIndex) => (
                <div
                  key={barIndex}
                  className="w-full rounded-full bg-primary/15 transition-all duration-500"
                  style={{
                    height: `${16 + ((barIndex + index * 3) % 6) * 8}px`,
                    opacity: barIndex / 28 < progress ? 1 : 0.35,
                  }}
                />
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-300"
                style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-[148px] shrink-0 flex-col gap-2">
        <div className="rounded-button border border-primary/20 bg-primary/5 px-3 py-2 text-center">
          <div className="font-poppins text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
            Training
          </div>
          <div className="mt-1 font-poppins text-xs font-medium text-text">
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div className="rounded-button border border-surface bg-surface-muted px-3 py-2 text-center font-codec text-[11px] text-text/50">
          Actions unlock after render
        </div>
      </div>
    </div>
  );
}
