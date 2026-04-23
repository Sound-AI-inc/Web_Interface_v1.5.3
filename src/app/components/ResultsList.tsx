import { useMemo, useState } from "react";
import ResultCard, { toCardItem } from "./ResultCard";
import type { AudioResult } from "../data/mock";

interface ResultsListProps {
  items: AudioResult[];
  title?: string;
  savedIds?: Set<string>;
  onAddToLibrary?: (item: AudioResult) => void;
  onRemix?: (item: AudioResult) => void;
  initialVisible?: number;
}

export default function ResultsList({
  items,
  title = "AudioResults",
  savedIds,
  onAddToLibrary,
  onRemix,
  initialVisible = 3,
}: ResultsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = useMemo(() => {
    if (expanded || items.length <= initialVisible) return items;
    return items.slice(0, initialVisible);
  }, [expanded, initialVisible, items]);

  return (
    <section className="rounded-card border border-primary/40 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-poppins text-sm font-semibold text-text">{title}</h2>
        {items.length > initialVisible ? (
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
    </section>
  );
}
