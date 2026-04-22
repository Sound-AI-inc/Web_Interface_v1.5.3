import ResultCard, { toCardItem } from "./ResultCard";
import type { AudioResult } from "../data/mock";

interface ResultsListProps {
  items: AudioResult[];
  title?: string;
  savedIds?: Set<string>;
  onAddToLibrary?: (item: AudioResult) => void;
  onRemix?: (item: AudioResult) => void;
}

export default function ResultsList({
  items,
  title = "AudioResults",
  savedIds,
  onAddToLibrary,
  onRemix,
}: ResultsListProps) {
  return (
    <section className="rounded-card border border-primary/40 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-poppins text-sm font-semibold text-text">{title}</h2>
        <span className="app-meta">Showing {items.length} results</span>
      </header>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
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
