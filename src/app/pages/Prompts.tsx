import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PromptCard from "../components/PromptCard";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import { prompts as promptSeed, type PromptItem } from "../data/mock";
import { setComposerPrefill } from "../lib/composerPrefill";
import { useLanguage } from "../i18n/LanguageProvider";

const GENRES = ["All", "Lo-fi", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Techno"];

const EMPTY_PROMPT = {
  title: "",
  body: "",
  genre: "Lo-fi",
  mood: "Calm",
  useCase: "Idea",
};

export default function Prompts() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [items, setItems] = useState<PromptItem[]>(promptSeed);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_PROMPT);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      { label: "Prompts", value: items.length },
      { label: "Total runs", value: items.reduce((sum, p) => sum + p.runs, 0) },
      { label: "Genres", value: new Set(items.map((p) => p.genre)).size },
    ],
    [items],
  );

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
    setEditingId(null);
  };

  const openCreate = () => {
    setDraft(EMPTY_PROMPT);
    setEditingId(null);
    setShowCreateModal(true);
  };

  const openEdit = (prompt: PromptItem) => {
    setDraft({
      title: prompt.title,
      body: prompt.body,
      genre: prompt.genre,
      mood: prompt.mood,
      useCase: prompt.useCase,
    });
    setEditingId(prompt.id);
    setShowCreateModal(true);
  };

  const generateFromPrompt = (prompt: PromptItem) => {
    setComposerPrefill({ prompt: prompt.body });
    setItems((current) =>
      current.map((p) => (p.id === prompt.id ? { ...p, runs: p.runs + 1 } : p)),
    );
    navigate("/app/generator");
  };

  const copyPromptBody = async (prompt: PromptItem) => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopiedId(prompt.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      window.alert(prompt.body);
    }
  };

  const savePrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) return;

    if (editingId) {
      setItems((current) =>
        current.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title,
                body,
                genre: draft.genre,
                mood: draft.mood,
                useCase: draft.useCase,
                updatedAt: "just now",
              }
            : p,
        ),
      );
      resetDraft();
      return;
    }

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
      <WorkspacePageShell
        title={t("prompts.title")}
        subtitle={t("prompts.subtitle")}
        stats={stats}
        actions={
          <button type="button" onClick={openCreate} className="app-btn-primary h-9">
            <Plus className="h-4 w-4" /> {t("prompts.new")}
          </button>
        }
      >
        <div className="premium-toolbar mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("prompts.searchPlaceholder")}
              className="app-input premium-search pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGenre(value)}
                className={`premium-filter-chip ${value === genre ? "is-active" : ""}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="premium-prompts-grid">
          {filtered.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={() => openEdit(prompt)}
              onCopy={() => copyPromptBody(prompt)}
              onGenerate={() => generateFromPrompt(prompt)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="premium-empty mt-8 rounded-[18px] border border-dashed border-[var(--border-primary)] p-10 text-center">
            <p className="font-poppins text-sm font-medium text-[var(--text-secondary)]">
              {t("prompts.noResults")}
            </p>
            <p className="app-meta mt-1">{t("prompts.noResultsHint")}</p>
          </div>
        )}

        {copiedId && (
          <div className="premium-toast fixed bottom-6 right-6 z-50 rounded-full px-4 py-2 font-codec text-xs">
            Prompt copied to clipboard
          </div>
        )}
      </WorkspacePageShell>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] px-4 backdrop-blur-sm">
          <div className="ui-modal-surface relative w-full max-w-2xl rounded-[20px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
                  {editingId ? "Edit prompt" : "Create a new prompt"}
                </h2>
                <p className="app-meta mt-1">
                  {editingId
                    ? "Update this reusable prompt in your library."
                    : "Add a reusable prompt and place it directly into your prompt library."}
                </p>
              </div>
              <button
                type="button"
                onClick={resetDraft}
                className="premium-icon-btn h-9 w-9"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={savePrompt}>
              <div>
                <label className="premium-field-label">Prompt name</label>
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
                <label className="premium-field-label">Prompt text</label>
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
                  <label className="premium-field-label">Genre</label>
                  <input
                    value={draft.genre}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, genre: event.target.value }))
                    }
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="premium-field-label">Mood</label>
                  <input
                    value={draft.mood}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, mood: event.target.value }))
                    }
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="premium-field-label">Use case</label>
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
                <button type="button" onClick={resetDraft} className="app-btn-ghost h-10 px-4">
                  Cancel
                </button>
                <button type="submit" className="app-btn-primary h-10 px-4">
                  {editingId ? "Save changes" : "Add prompt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
