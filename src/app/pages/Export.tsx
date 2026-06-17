import { useMemo, useState } from "react";
import {
  Folder as FolderIcon,
  Download,
  CheckSquare,
  Square,
  Search,
  Briefcase,
} from "lucide-react";
import ProGate from "../components/ProGate";
import ViewModeToggle from "../components/workspace/ViewModeToggle";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import type { ResultKind } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useWorkspaceStore } from "../state/workspaceStore";
import { useLanguage } from "../i18n/LanguageProvider";

type TypeFilter = "all" | ResultKind;
type SourceTab = "library" | "projects";
type ExportScope = "selected" | "project" | "all";

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
  const assetProject = useLibraryStore((s) => s.assetProject);
  const viewMode = useLibraryStore((s) => s.viewMode);
  const setViewMode = useLibraryStore((s) => s.setViewMode);
  const projects = useWorkspaceStore((s) => s.projects);

  const [sourceTab, setSourceTab] = useState<SourceTab>("library");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportScope, setExportScope] = useState<ExportScope>("selected");
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id ?? "");

  const filterAsset = (a: (typeof assets)[number]) => {
    if (typeFilter !== "all" && a.kind !== typeFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  };

  const libraryGroups = useMemo(() => {
    return folders.map((f) => ({
      folder: f,
      items: assets.filter((a) => {
        const fid = assetFolder[a.id] ?? LIBRARY_ROOT_ID;
        if (fid !== f.id) return false;
        return filterAsset(a);
      }),
    }));
  }, [folders, assets, assetFolder, typeFilter, query]);

  const projectGroups = useMemo(() => {
    return projects.map((project) => ({
      project,
      items: assets.filter((a) => assetProject[a.id] === project.id && filterAsset(a)),
    }));
  }, [projects, assets, assetProject, typeFilter, query]);

  const groups = sourceTab === "library" ? libraryGroups : projectGroups;

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
    let items = assets;
    if (exportScope === "selected") {
      items = assets.filter((a) => selected.has(a.id));
    } else if (exportScope === "project" && activeProjectId) {
      items = assets.filter((a) => assetProject[a.id] === activeProjectId);
    }
    console.info("Export queue:", items);
  };

  return (
    <WorkspacePageShell
      title={t("export.title")}
      subtitle={t("export.subtitle")}
      stats={stats}
      actions={
        <div className="flex items-center gap-2">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button
            type="button"
            onClick={exportSelected}
            disabled={exportScope === "selected" && selected.size === 0}
            className="app-btn-primary h-9 px-4"
          >
            <Download className="h-3.5 w-3.5" />
            {t("export.exportSelected")}{" "}
            {exportScope === "selected" && selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      }
    >
      <div className="premium-toolbar mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSourceTab("library")}
          className={`premium-filter-chip ${sourceTab === "library" ? "is-active" : ""}`}
        >
          <FolderIcon className="h-3.5 w-3.5" /> Library assets
        </button>
        <button
          type="button"
          onClick={() => setSourceTab("projects")}
          className={`premium-filter-chip ${sourceTab === "projects" ? "is-active" : ""}`}
        >
          <Briefcase className="h-3.5 w-3.5" /> Projects
        </button>
      </div>

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
          <select
            value={exportScope}
            onChange={(e) => setExportScope(e.target.value as ExportScope)}
            className="app-input h-9 w-auto text-xs"
          >
            <option value="selected">Single / multiple assets</option>
            <option value="project">Entire project</option>
            <option value="all">All visible</option>
          </select>
          {exportScope === "project" && (
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="app-input h-9 w-auto text-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
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

      <div className={`flex flex-col gap-4 ${viewMode === "grid" ? "md:grid md:grid-cols-2 md:gap-4" : ""}`}>
        {groups.map((group) => {
          const header =
            sourceTab === "library"
              ? (group as (typeof libraryGroups)[number]).folder.name
              : (group as (typeof projectGroups)[number]).project.name;
          const items = group.items;
          return (
            <section key={header} className="premium-export-group">
              <header className="premium-export-group-header">
                {sourceTab === "library" ? (
                  <FolderIcon className="h-4 w-4 text-primary" />
                ) : (
                  <Briefcase className="h-4 w-4 text-primary" />
                )}
                <h3 className="font-poppins text-sm font-semibold text-[var(--text-primary)]">{header}</h3>
                <span className="font-codec text-xs text-[var(--text-muted)]">
                  {items.length} file{items.length === 1 ? "" : "s"}
                </span>
              </header>

              {items.length === 0 ? (
                <div className="premium-empty rounded-[14px] border border-dashed border-[var(--border-primary)] p-5 text-center font-codec text-xs text-[var(--text-muted)]">
                  {t("export.noFiles")}
                </div>
              ) : viewMode === "list" ? (
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
                            <span>·</span>
                            <span>{a.createdAt}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((a) => {
                    const isSel = selected.has(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggle(a.id)}
                        className={`rounded-[14px] border p-3 text-left transition-colors ${
                          isSel
                            ? "border-primary bg-primary/5"
                            : "border-[var(--border-primary)] bg-[var(--surface-primary)] hover:border-primary/30"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate font-poppins text-sm font-medium text-[var(--text-primary)]">
                            {a.title}
                          </span>
                          {isSel ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div className="font-codec text-[11px] uppercase text-[var(--text-muted)]">
                          {a.kind} · {a.format}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
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
