import { useMemo, useState, type FormEvent } from "react";
import { Clock, Plus, Search, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PromptCard from "../components/PromptCard";
import ViewModeToggle from "../components/workspace/ViewModeToggle";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import { prompts as promptSeed, type PromptItem } from "../data/mock";
import { setComposerPrefill } from "../lib/composerPrefill";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  EMPTY_PROMPT_DRAFT,
  PROMPT_CATEGORIES,
  PROMPT_TEMPLATES,
  usePromptsStore,
  type PromptDraft,
} from "../state/promptsStore";

const GENRES = ["All", "Lo-fi", "Synthwave", "Cinematic", "Hip-hop", "Jazz", "Techno"];

export default function Prompts() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const viewMode = usePromptsStore((s) => s.viewMode);
  const setViewMode = usePromptsStore((s) => s.setViewMode);
  const history = usePromptsStore((s) => s.history);
  const pushHistory = usePromptsStore((s) => s.pushHistory);

  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [items, setItems] = useState<PromptItem[]>(promptSeed);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromptDraft>(EMPTY_PROMPT_DRAFT);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      { label: t("prompts.statsPrompts"), value: items.length },
      { label: t("prompts.statsRuns"), value: items.reduce((sum, p) => sum + p.runs, 0) },
      { label: t("prompts.statsHistory"), value: history.length },
    ],
    [items, history.length, t],
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
    setDraft(EMPTY_PROMPT_DRAFT);
    setShowCreateModal(false);
    setEditingId(null);
  };

  const openCreate = () => {
    setDraft(EMPTY_PROMPT_DRAFT);
    setEditingId(null);
    setShowCreateModal(true);
  };

  const openEdit = (prompt: PromptItem) => {
    setDraft({
      title: prompt.title,
      body: prompt.body,
      genre: prompt.genre,
      mood: prompt.mood,
      energy: prompt.tags.find((tag) => ["Low", "Medium", "High", "Peak"].includes(tag)) ?? "Medium",
      tempo: prompt.tags.find((tag) => tag.includes("BPM") || tag.includes("Slow") || tag.includes("Fast")) ?? "Mid (90-120)",
      instrument: prompt.tags.find((tag) =>
        ["Piano", "Synth", "Guitar", "Drums", "Bass", "Strings", "Brass"].includes(tag),
      ) ?? "Piano",
      texture: prompt.tags.find((tag) =>
        ["Warm", "Bright", "Gritty", "Airy", "Dense", "Minimal"].includes(tag),
      ) ?? "Warm",
      complexity: prompt.tags.find((tag) =>
        ["Simple", "Moderate", "Layered", "Experimental"].includes(tag),
      ) ?? "Simple",
    });
    setEditingId(prompt.id);
    setShowCreateModal(true);
  };

  const generateFromPrompt = (prompt: PromptItem) => {
    pushHistory(prompt.body);
    setComposerPrefill({ prompt: prompt.body });
    setItems((current) =>
      current.map((p) => (p.id === prompt.id ? { ...p, runs: p.runs + 1 } : p)),
    );
    navigate("/app/generator");
  };

  const applyTemplate = (body: string, title: string) => {
    setDraft((current) => ({ ...current, body, title: current.title || title }));
    setShowCreateModal(true);
  };

  const applyHistory = (text: string) => {
    setDraft((current) => ({ ...current, body: text }));
    setShowCreateModal(true);
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

    const categoryTags = PROMPT_CATEGORIES.map((cat) => draft[cat.key]).filter(Boolean);

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
                tags: Array.from(new Set([...categoryTags, draft.genre.toLowerCase(), draft.mood.toLowerCase()])),
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
      useCase: "Idea",
      tags: Array.from(
        new Set([
          ...categoryTags.map((v) => v.toLowerCase()),
          draft.genre.toLowerCase(),
          draft.mood.toLowerCase(),
        ]),
      ),
      updatedAt: "just now",
      runs: 0,
    };

    setItems((current) => [nextPrompt, ...current]);
    pushHistory(body);
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
          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <button type="button" onClick={openCreate} className="app-btn-primary h-9">
              <Plus className="h-4 w-4" /> {t("prompts.new")}
            </button>
          </div>
        }
      >
        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr]">
          <aside className="flex flex-col gap-4">
            <section className="rounded-[16px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-codec text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {t("prompts.templates")}
                </h3>
              </div>
              <ul className="flex flex-col gap-1.5">
                {PROMPT_TEMPLATES.map((template) => (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => applyTemplate(template.body, template.title)}
                      className="w-full rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-[var(--surface-secondary)]"
                    >
                      <div className="font-poppins text-xs font-medium text-[var(--text-primary)]">
                        {template.title}
                      </div>
                      <div className="mt-0.5 line-clamp-2 font-codec text-[11px] text-[var(--text-muted)]">
                        {template.body}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[16px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="font-codec text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  {t("prompts.history")}
                </h3>
              </div>
              {history.length === 0 ? (
                <p className="font-codec text-[11px] text-[var(--text-muted)]">{t("prompts.historyEmpty")}</p>
              ) : (
                <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {history.slice(0, 8).map((entry) => (
                    <li key={entry}>
                      <button
                        type="button"
                        onClick={() => applyHistory(entry)}
                        className="w-full truncate rounded-[8px] px-2 py-1.5 text-left font-codec text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)]"
                      >
                        {entry}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <div className="min-w-0">
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

            <div className={viewMode === "grid" ? "premium-prompts-grid" : "flex flex-col gap-2"}>
              {filtered.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  variant={viewMode}
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
          </div>
        </div>

        {copiedId && (
          <div className="premium-toast fixed bottom-6 right-6 z-50 rounded-full px-4 py-2 font-codec text-xs">
            {t("prompts.copied")}
          </div>
        )}
      </WorkspacePageShell>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] px-4 backdrop-blur-sm">
          <div className="ui-modal-surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[20px] p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
                  {editingId ? t("prompts.editTitle") : t("prompts.createTitle")}
                </h2>
                <p className="app-meta mt-1">
                  {editingId ? t("prompts.editSubtitle") : t("prompts.createSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={resetDraft}
                className="premium-icon-btn h-9 w-9"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={savePrompt}>
              <div>
                <label className="premium-field-label">{t("prompts.fieldName")}</label>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder={t("prompts.fieldNamePlaceholder")}
                  className="app-input"
                />
              </div>

              <div>
                <label className="premium-field-label">{t("prompts.fieldText")}</label>
                <textarea
                  value={draft.body}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, body: event.target.value }))
                  }
                  placeholder={t("prompts.fieldTextPlaceholder")}
                  className="app-input min-h-32 resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {PROMPT_CATEGORIES.map((category) => (
                  <div key={category.key}>
                    <label className="premium-field-label">{category.label}</label>
                    <select
                      value={draft[category.key]}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [category.key]: event.target.value,
                        }))
                      }
                      className="app-input"
                    >
                      {category.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={resetDraft} className="app-btn-ghost h-10 px-4">
                  {t("common.cancel")}
                </button>
                <button type="submit" className="app-btn-primary h-10 px-4">
                  {editingId ? t("common.save") : t("prompts.addPrompt")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
