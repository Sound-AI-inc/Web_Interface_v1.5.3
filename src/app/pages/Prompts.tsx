import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, X } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptCard from "../components/PromptCard";
import { prompts as promptSeed, type PromptItem } from "../data/mock";

const GENRES = ["All", "Lo-fi", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Techno"];

const EMPTY_PROMPT = {
  title: "",
  body: "",
  genre: "Lo-fi",
  mood: "Calm",
  useCase: "Idea",
};

export default function Prompts() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [items, setItems] = useState<PromptItem[]>(promptSeed);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PROMPT);

  const filtered = useMemo(() => {
    return items.filter((prompt) => {
      if (genre !== "All" && prompt.genre !== genre) return false;
      if (!query) return true;
      const normalizedQuery = query.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(normalizedQuery) ||
        prompt.body.toLowerCase().includes(normalizedQuery) ||
        prompt.tags.some((tag) => tag.includes(normalizedQuery))
      );
    });
  }, [genre, items, query]);

  const resetDraft = () => {
    setDraft(EMPTY_PROMPT);
    setShowCreateModal(false);
  };

  const createPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) return;

    const nextPrompt: PromptItem = {
      id: `prompt-${Date.now()}`,
      title,
      body,
      genre: draft.genre,
      mood: draft.mood,
      useCase: draft.useCase,
      tags: Array.from(
        new Set(
          `${title} ${body}`
            .toLowerCase()
            .split(/[^a-z0-9]+/i)
            .filter((value) => value.length > 2)
            .slice(0, 5),
        ),
      ),
      updatedAt: "just now",
      runs: 0,
    };

    setItems((current) => [nextPrompt, ...current]);
    setGenre("All");
    setQuery("");
    resetDraft();
  };

  return (
    <>
      <PageContainer
        title="Prompts"
        subtitle="Your reusable prompt library"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="app-btn-primary h-9"
          >
            <Plus className="h-4 w-4" /> New Prompt
          </button>
        }
      >
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts..."
              className="app-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGenre(value)}
                className={`rounded-full px-3 py-1.5 font-codec text-xs transition-colors ${
                  value === genre
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-muted text-text/60 hover:bg-surface"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 rounded-card border border-dashed border-surface bg-surface-muted p-10 text-center">
            <p className="font-poppins text-sm font-medium text-text/70">No prompts match your filters.</p>
            <p className="app-meta mt-1">Try clearing the search or selecting a different genre.</p>
          </div>
        )}
      </PageContainer>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-card border border-primary/20 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-poppins text-lg font-semibold text-text">Create a new prompt</h2>
                <p className="app-meta mt-1">
                  Add a reusable prompt and place it directly into your prompt library.
                </p>
              </div>
              <button
                type="button"
                onClick={resetDraft}
                className="flex h-9 w-9 items-center justify-center rounded-button border border-surface text-text/60 transition-colors hover:border-primary/30 hover:text-primary"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={createPrompt}>
              <div>
                <label className="mb-1.5 block font-poppins text-xs font-medium uppercase tracking-[0.08em] text-text/50">
                  Prompt name
                </label>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Late-night tape piano"
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-poppins text-xs font-medium uppercase tracking-[0.08em] text-text/50">
                  Prompt text
                </label>
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, body: event.target.value }))
                  }
                  placeholder="Describe the mood, instrumentation and production details..."
                  className="app-input min-h-32 resize-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block font-poppins text-xs font-medium uppercase tracking-[0.08em] text-text/50">
                    Genre
                  </label>
                  <input
                    value={draft.genre}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, genre: event.target.value }))
                    }
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-poppins text-xs font-medium uppercase tracking-[0.08em] text-text/50">
                    Mood
                  </label>
                  <input
                    value={draft.mood}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, mood: event.target.value }))
                    }
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-poppins text-xs font-medium uppercase tracking-[0.08em] text-text/50">
                    Use case
                  </label>
                  <input
                    value={draft.useCase}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, useCase: event.target.value }))
                    }
                    className="app-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetDraft}
                  className="app-btn-ghost h-10 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="app-btn-primary h-10 px-4">
                  Add prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
