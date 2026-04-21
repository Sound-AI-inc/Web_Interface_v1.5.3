import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import PageContainer from "../components/PageContainer";
import PromptCard from "../components/PromptCard";
import BrandSelect from "../components/BrandSelect";
import { prompts as seedPrompts, type PromptItem } from "../data/mock";

const GENRES = ["All", "Lo-fi", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Techno"];
const GENRE_OPTIONS = GENRES.filter((g) => g !== "All");
const MOOD_OPTIONS = [
  "Chill",
  "Energetic",
  "Dreamy",
  "Dark",
  "Uplifting",
  "Melancholic",
  "Aggressive",
];
const USE_CASE_OPTIONS = [
  "Background",
  "Drop",
  "Hook",
  "Intro",
  "Outro",
  "Transition",
  "Sound design",
];

interface NewPromptDraft {
  title: string;
  body: string;
  genre: string;
  mood: string;
  useCase: string;
  tags: string;
}

const EMPTY_DRAFT: NewPromptDraft = {
  title: "",
  body: "",
  genre: GENRE_OPTIONS[0],
  mood: MOOD_OPTIONS[0],
  useCase: USE_CASE_OPTIONS[0],
  tags: "",
};

export default function Prompts() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [items, setItems] = useState<PromptItem[]>(seedPrompts);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<NewPromptDraft>(EMPTY_DRAFT);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (genre !== "All" && p.genre !== genre) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    });
  }, [query, genre, items]);

  // Close on Escape + prevent body scroll while modal is open.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  const openModal = () => {
    setDraft(EMPTY_DRAFT);
    setModalOpen(true);
  };

  const canSubmit = draft.title.trim().length > 0 && draft.body.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const now = new Date();
    const tags = draft.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    const newPrompt: PromptItem = {
      id: `p-${Date.now()}`,
      title: draft.title.trim(),
      body: draft.body.trim(),
      tags,
      genre: draft.genre,
      mood: draft.mood,
      useCase: draft.useCase,
      updatedAt: now.toISOString().slice(0, 10),
      runs: 0,
    };
    setItems((prev) => [newPrompt, ...prev]);
    setModalOpen(false);
  };

  return (
    <PageContainer
      title="Prompts"
      subtitle="Your reusable prompt library"
      actions={
        <button
          type="button"
          onClick={openModal}
          className="app-btn-primary h-9"
        >
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

      {modalOpen && (
        <NewPromptModal
          draft={draft}
          setDraft={setDraft}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
          canSubmit={canSubmit}
        />
      )}
    </PageContainer>
  );
}

interface NewPromptModalProps {
  draft: NewPromptDraft;
  setDraft: React.Dispatch<React.SetStateAction<NewPromptDraft>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  canSubmit: boolean;
}

function NewPromptModal({ draft, setDraft, onClose, onSubmit, canSubmit }: NewPromptModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-text/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-lg rounded-card border border-surface bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-surface px-5 py-4">
          <h3 id="new-prompt-title" className="font-poppins text-sm font-semibold text-text">
            New prompt
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-5">
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Dreamy synthwave pad"
              className="app-input"
              autoFocus
            />
          </Field>
          <Field label="Prompt">
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              rows={4}
              placeholder="Describe the mood, instruments, BPM, key, and length…"
              className="app-input resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Genre">
              <BrandSelect
                value={draft.genre}
                options={GENRE_OPTIONS}
                onChange={(v) => setDraft((d) => ({ ...d, genre: v }))}
              />
            </Field>
            <Field label="Mood">
              <BrandSelect
                value={draft.mood}
                options={MOOD_OPTIONS}
                onChange={(v) => setDraft((d) => ({ ...d, mood: v }))}
              />
            </Field>
            <Field label="Use case">
              <BrandSelect
                value={draft.useCase}
                options={USE_CASE_OPTIONS}
                onChange={(v) => setDraft((d) => ({ ...d, useCase: v }))}
              />
            </Field>
          </div>

          <Field label="Tags" hint="Comma-separated. Stored without the # prefix.">
            <input
              value={draft.tags}
              onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              placeholder="lofi, piano, chill"
              className="app-input"
            />
          </Field>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-surface px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="app-btn-ghost h-9 px-4 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="app-btn-primary h-9 px-4 text-sm"
          >
            <Plus className="h-4 w-4" /> Add prompt
          </button>
        </footer>
      </form>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="app-meta font-medium text-text/70">{label}</span>
      {children}
      {hint && <span className="app-meta text-[10px] text-text/40">{hint}</span>}
    </label>
  );
}
