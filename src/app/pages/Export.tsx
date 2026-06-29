import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckSquare,
  Download,
  Folder as FolderIcon,
  Search,
  Square,
} from "lucide-react";
import ProGate from "../components/ProGate";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import type { ResultKind } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useWorkspaceStore } from "../state/workspaceStore";

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
  const projects = useWorkspaceStore((s) => s.projects);

  const [sourceTab, setSourceTab] = useState<SourceTab>("library");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exportScope, setExportScope] = useState<ExportScope>("selected");
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id ?? "");

  const filterAsset = (asset: (typeof assets)[number]) => {
    if (typeFilter !== "all" && asset.kind !== typeFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      asset.title.toLowerCase().includes(q) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  };

  const libraryGroups = useMemo(
    () =>
      folders.map((folder) => ({
        id: folder.id,
        label: folder.name,
        icon: FolderIcon,
        items: assets.filter((asset) => {
          const folderId = assetFolder[asset.id] ?? LIBRARY_ROOT_ID;
          return folderId === folder.id && filterAsset(asset);
        }),
      })),
    [folders, assets, assetFolder, typeFilter, query],
  );

  const projectGroups = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: project.name,
        icon: Briefcase,
        items: assets.filter((asset) => assetProject[asset.id] === project.id && filterAsset(asset)),
      })),
    [projects, assets, assetProject, typeFilter, query],
  );

  const groups = sourceTab === "library" ? libraryGroups : projectGroups;
  const allVisibleIds = useMemo(() => groups.flatMap((group) => group.items.map((asset) => asset.id)), [groups]);

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
      items = assets.filter((asset) => selected.has(asset.id));
    } else if (exportScope === "project" && activeProjectId) {
      items = assets.filter((asset) => assetProject[asset.id] === activeProjectId);
    } else {
      items = assets.filter((asset) => allVisibleIds.includes(asset.id));
    }
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
          disabled={exportScope === "selected" && selected.size === 0}
          className="app-btn-primary h-9 px-4"
        >
          <Download className="h-3.5 w-3.5" />
          {t("export.exportSelected")}
          {exportScope === "selected" && selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
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

      <div className="premium-toolbar mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            onChange={(event) => setExportScope(event.target.value as ExportScope)}
            className="app-input h-9 w-auto text-xs"
          >
            <option value="selected">Selected assets</option>
            <option value="project">Entire project</option>
            <option value="all">All visible</option>
          </select>
          {exportScope === "project" && (
            <select
              value={activeProjectId}
              onChange={(event) => setActiveProjectId(event.target.value)}
              className="app-input h-9 w-auto text-xs"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("export.search")}
              className="app-input premium-search pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.id} className="premium-export-group">
              <header className="premium-export-group-header">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="font-poppins text-sm font-semibold text-[var(--text-primary)]">
                  {group.label}
                </h3>
                <span className="font-codec text-xs text-[var(--text-muted)]">
                  {group.items.length} file{group.items.length === 1 ? "" : "s"}
                </span>
              </header>
              {group.items.length === 0 ? (
                <div className="premium-empty rounded-[14px] border border-dashed border-[var(--border-primary)] p-5 text-center font-codec text-xs text-[var(--text-muted)]">
                  {t("export.noFiles")}
                </div>
              ) : (
                <div className="flex flex-col">
                  {group.items.map((asset) => {
                    const isSelected = selected.has(asset.id);
                    const projectName =
                      projects.find((project) => project.id === assetProject[asset.id])?.name ?? "Unassigned";
                    return (
                      <div key={asset.id} className="premium-export-row">
                        <button
                          type="button"
                          onClick={() => toggle(asset.id)}
                          className={`shrink-0 ${isSelected ? "text-primary" : "text-[var(--text-muted)]"}`}
                          aria-label={isSelected ? "Deselect" : "Select"}
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-poppins text-sm text-[var(--text-primary)]">
                            {asset.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
                            <span>{projectName}</span>
                            <span>·</span>
                            <span className="uppercase">{asset.kind}</span>
                            <span>·</span>
                            <span>{asset.format}</span>
                            <span>·</span>
                            <span>{asset.createdAt}</span>
                          </div>
                        </div>
                        <span className="hidden w-[92px] shrink-0 font-codec text-[11px] text-[var(--text-muted)] sm:block">
                          Ready
                        </span>
                        <button
                          type="button"
                          onClick={() => toggle(asset.id)}
                          className="premium-asset-action h-8 px-3 text-[11px]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export
                        </button>
                      </div>
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
