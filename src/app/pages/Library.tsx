import { useMemo, useState } from "react";
import { Grid3x3, List, Search } from "lucide-react";
import PageContainer from "../components/PageContainer";
import LibraryItem from "../components/LibraryItem";
import { library } from "../data/mock";
import type { LibraryAsset } from "../data/mock";

type ViewMode = "grid" | "list";
type TypeFilter = "All" | LibraryAsset["type"];

const TYPE_FILTERS: TypeFilter[] = ["All", "Audio", "MIDI", "Preset"];

export default function Library() {
  const [view, setView] = useState<ViewMode>("grid");
  const [type, setType] = useState<TypeFilter>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return library.filter((a) => {
      if (type !== "All" && a.type !== type) return false;
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
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 font-codec text-xs transition-colors ${
                t === type
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              {t}
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
          <div className="flex items-center overflow-hidden rounded-button border border-surface bg-white">
            <button
              onClick={() => setView("grid")}
              className={`flex h-10 w-10 items-center justify-center transition-colors ${
                view === "grid" ? "bg-primary/10 text-primary" : "text-text/60 hover:bg-surface"
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-10 w-10 items-center justify-center transition-colors ${
                view === "list" ? "bg-primary/10 text-primary" : "text-text/60 hover:bg-surface"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((a) => (
            <LibraryItem key={a.id} item={a} view="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <LibraryItem key={a.id} item={a} view="list" />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
