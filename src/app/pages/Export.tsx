import { useMemo, useState } from "react";
import {
  Folder as FolderIcon,
  Download,
  CheckSquare,
  Square,
  Search,
} from "lucide-react";
import PageContainer from "../components/PageContainer";
import type { ResultKind } from "../data/mock";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";

type TypeFilter = "all" | ResultKind;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

/**
 * Dedicated Export center. Lists every library item grouped by folder with
 * multi-select + filter, and a single "Export selected" action that hands
 * the chosen files off to downstream DAW / filesystem integrations.
 */
export default function Export() {
  const folders = useLibraryStore((s) => s.folders);
  const assets = useLibraryStore((s) => s.assets);
  const assetFolder = useLibraryStore((s) => s.assetFolder);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    return folders.map((f) => ({
      folder: f,
      items: assets.filter((a) => {
        const fid = assetFolder[a.id] ?? LIBRARY_ROOT_ID;
        if (fid !== f.id) return false;
        if (typeFilter !== "all" && a.kind !== typeFilter) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
        );
      }),
    }));
  }, [folders, assets, assetFolder, typeFilter, query]);

  const allVisibleIds = useMemo(
    () => groups.flatMap((g) => g.items.map((a) => a.id)),
    [groups],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === allVisibleIds.length) return new Set();
      return new Set(allVisibleIds);
    });
  };

  const exportSelected = () => {
    // Placeholder: downstream integration would actually write files.
    // Keep the UI truthful by reporting the pending count.
    const items = assets.filter((a) => selected.has(a.id));
    console.info("Export queue:", items);
  };

  return (
    <PageContainer
      title="Export"
      subtitle="Send library assets to your local DAW or disk"
      actions={
        <button
          type="button"
          onClick={exportSelected}
          disabled={selected.size === 0}
          className="app-btn-primary h-9 px-4"
        >
          <Download className="h-3.5 w-3.5" />
          Export {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      }
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`h-9 rounded-full px-3 font-codec text-xs transition-colors ${
                typeFilter === t.value
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="app-btn-ghost h-9 px-3 text-xs"
          >
            {selected.size === allVisibleIds.length && allVisibleIds.length > 0
              ? "Deselect all"
              : "Select all"}
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files…"
              className="app-input pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map(({ folder, items }) => (
          <section key={folder.id} className="app-card p-5">
            <header className="mb-3 flex items-center gap-2">
              <FolderIcon className="h-4 w-4 text-text/60" />
              <h3 className="font-poppins text-sm font-semibold text-text">
                {folder.name}
              </h3>
              <span className="font-codec text-xs text-text/50">
                {items.length} file{items.length === 1 ? "" : "s"}
              </span>
            </header>

            {items.length === 0 ? (
              <div className="rounded-card border border-dashed border-surface p-5 text-center font-codec text-xs text-text/40">
                No matching files in this folder.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-surface">
                {items.map((a) => {
                  const isSel = selected.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(a.id)}
                        className={`shrink-0 ${
                          isSel ? "text-primary" : "text-text/40"
                        }`}
                        aria-label={isSel ? "Deselect" : "Select"}
                      >
                        {isSel ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-poppins text-sm text-text">
                          {a.title}
                        </div>
                        <div className="flex items-center gap-2 font-codec text-[11px] text-text/50">
                          <span className="uppercase tracking-wider">
                            {a.kind}
                          </span>
                          <span>·</span>
                          <span>{a.format}</span>
                          {a.duration && (
                            <>
                              <span>·</span>
                              <span>{a.duration}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{a.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {a.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-surface-muted px-2 py-0.5 font-codec text-[10px] text-text/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
