import { useMemo, useState } from "react";
import {
  Folder as FolderIcon,
  Download,
  CheckSquare,
  Square,
  Search,
} from "lucide-react";
import ProGate from "../components/ProGate";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import type { ResultKind } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useLanguage } from "../i18n/LanguageProvider";

type TypeFilter = "all" | ResultKind;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

function ExportWorkspace() {
  const { t } = useLanguage();
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
          a.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }),
    }));
  }, [folders, assets, assetFolder, typeFilter, query]);

  const allVisibleIds = useMemo(
    () => groups.flatMap((g) => g.items.map((a) => a.id)),
    [groups],
  );

  const stats = useMemo(
    () => [
      { label: "Selected", value: selected.size },
      { label: "Visible", value: allVisibleIds.length },
      { label: "Total library", value: assets.length },
    ],
    [selected.size, allVisibleIds.length, assets.length],
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
    const items = assets.filter((a) => selected.has(a.id));
    console.info("Export queue:", items);
  };

  return (
    <WorkspacePageShell
      title={t("export.title")}
      subtitle={t("export.subtitle")}
      stats={stats}
      actions={
        <button
          type="button"
          onClick={exportSelected}
          disabled={selected.size === 0}
          className="app-btn-primary h-9 px-4"
        >
          <Download className="h-3.5 w-3.5" />
          {t("export.exportSelected")} {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      }
    >
      <div className="premium-toolbar mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`premium-filter-chip ${typeFilter === filter.value ? "is-active" : ""}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleAll} className="premium-asset-action h-9 px-3 text-xs">
            {selected.size === allVisibleIds.length && allVisibleIds.length > 0
              ? t("export.deselectAll")
              : t("export.selectAll")}
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("export.search")}
              className="app-input premium-search pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map(({ folder, items }) => (
          <section key={folder.id} className="premium-export-group">
            <header className="premium-export-group-header">
              <FolderIcon className="h-4 w-4 text-primary" />
              <h3 className="font-poppins text-sm font-semibold text-[var(--text-primary)]">{folder.name}</h3>
              <span className="font-codec text-xs text-[var(--text-muted)]">
                {items.length} file{items.length === 1 ? "" : "s"}
              </span>
            </header>

            {items.length === 0 ? (
              <div className="premium-empty rounded-[14px] border border-dashed border-[var(--border-primary)] p-5 text-center font-codec text-xs text-[var(--text-muted)]">
                {t("export.noFiles")}
              </div>
            ) : (
              <div className="flex flex-col">
                {items.map((a) => {
                  const isSel = selected.has(a.id);
                  return (
                    <div key={a.id} className="premium-export-row">
                      <button
                        type="button"
                        onClick={() => toggle(a.id)}
                        className={`shrink-0 ${isSel ? "text-primary" : "text-[var(--text-muted)]"}`}
                        aria-label={isSel ? "Deselect" : "Select"}
                      >
                        {isSel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-poppins text-sm text-[var(--text-primary)]">{a.title}</div>
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
                          <span className="uppercase">{a.kind}</span>
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
                        {a.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="premium-chip">
                            {tag}
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
    </WorkspacePageShell>
  );
}

export default function Export() {
  const { t } = useLanguage();
  const { mode } = useInterfaceMode();

  if (mode !== "pro") {
    return (
      <ProGate
        title={t("export.title")}
        subtitle={t("export.subtitle")}
        feature="Export sends your library assets to your local DAW or disk."
      />
    );
  }

  return <ExportWorkspace />;
}
