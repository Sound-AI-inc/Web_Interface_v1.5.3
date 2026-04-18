import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptCard from "../components/PromptCard";
import { prompts } from "../data/mock";

const GENRES = ["All", "Lo-fi", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Techno"];

export default function Prompts() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");

  const filtered = useMemo(() => {
    return prompts.filter((p) => {
      if (genre !== "All" && p.genre !== genre) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    });
  }, [query, genre]);

  return (
    <PageContainer
      title="Prompts"
      subtitle="Your reusable prompt library"
      actions={
        <button className="app-btn-primary h-9">
          <Plus className="h-4 w-4" /> New prompt
        </button>
      }
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="app-input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`rounded-full px-3 py-1.5 font-codec text-xs transition-colors ${
                g === genre
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <PromptCard key={p.id} prompt={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-card border border-dashed border-surface bg-surface-muted p-10 text-center">
          <p className="font-poppins text-sm font-medium text-text/70">No prompts match your filters.</p>
          <p className="app-meta mt-1">Try clearing the search or selecting a different genre.</p>
        </div>
      )}
    </PageContainer>
  );
}
