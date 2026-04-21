import { useState } from "react";
import ResultCard, { toCardItem } from "./ResultCard";
import type { AudioResult } from "../data/mock";

interface ResultsListProps {
  items: AudioResult[];
  title?: string;
  savedIds?: Set<string>;
  onAddToLibrary?: (item: AudioResult) => void;
  onRemix?: (item: AudioResult) => void;
  /** When set, the list collapses to `previewLimit` items with a "Show all"
   *  toggle. Omit to always show every item. */
  previewLimit?: number;
  /** Optional hint rendered below the header when the list is a placeholder. */
  emptyHint?: string;
}

export default function ResultsList({
  items,
  title = "AudioResults",
  savedIds,
  onAddToLibrary,
  onRemix,
  previewLimit,
  emptyHint,
}: ResultsListProps) {
  const [showAll, setShowAll] = useState(false);

  const canCollapse =
    typeof previewLimit === "number" && items.length > previewLimit;
  const visible = canCollapse && !showAll ? items.slice(0, previewLimit) : items;

  return (
    <section className="rounded-card border border-primary/40 bg-white/80 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-poppins text-sm font-semibold text-text">{title}</h2>
        {canCollapse ? (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="app-btn-ghost h-8 px-3 text-xs"
            aria-expanded={showAll}
          >
            {showAll ? "Show less" : `Show all (${items.length})`}
          </button>
        ) : (
          <span className="app-meta">Showing {items.length} results</span>
        )}
      </header>
      {emptyHint && (
        <p className="app-meta mb-3 italic">{emptyHint}</p>
      )}
      <div className="flex flex-col gap-3">
        {visible.map((item) => (
          <ResultCard
            key={item.id}
            item={toCardItem(item)}
            savedToLibrary={savedIds?.has(item.id)}
            onAddToLibrary={() => onAddToLibrary?.(item)}
            onRemix={() => onRemix?.(item)}
          />
        ))}
      </div>
    </section>
  );
}
