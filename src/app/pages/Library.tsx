import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageContainer from "../components/PageContainer";
import ResultCard, { toCardItem } from "../components/ResultCard";
import { library } from "../data/mock";
import type { LibraryAsset, ResultKind } from "../data/mock";

type TypeFilter = "all" | ResultKind;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

export default function Library() {
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return library.filter((a: LibraryAsset) => {
      if (type !== "all" && a.kind !== type) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
      );
    });
  }, [type, query]);

  return (
    <PageContainer title="Library" subtitle="Your generated and saved assets">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`h-9 rounded-full px-3 font-codec text-xs transition-colors ${
                t.value === type
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search library…"
              className="app-input pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((a) => (
          <ResultCard key={a.id} item={toCardItem(a)} savedToLibrary />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-card border border-surface bg-surface-muted p-8 text-center font-codec text-sm text-text/60">
            No assets match your filters.
          </div>
        )}
      </div>
    </PageContainer>
  );
}
