import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Folder as FolderIcon,
  FolderPlus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Star,
  Briefcase,
} from "lucide-react";
import ProGate from "../components/ProGate";
import ResultCard, { toCardItem } from "../components/ResultCard";
import FolderFilePlayer from "../components/FolderFilePlayer";
import ViewModeToggle from "../components/workspace/ViewModeToggle";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import type { LibraryAsset, ResultKind } from "../data/mock";
import { setEditorIntent } from "../lib/editorIntent";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useWorkspaceStore } from "../state/workspaceStore";
import { useLanguage } from "../i18n/LanguageProvider";

type TypeFilter = "all" | ResultKind;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

function LibraryWorkspace() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const folders = useLibraryStore((s) => s.folders);
  const assets = useLibraryStore((s) => s.assets);
  const assetFolder = useLibraryStore((s) => s.assetFolder);
  const addFolder = useLibraryStore((s) => s.addFolder);
  const renameFolder = useLibraryStore((s) => s.renameFolder);
  const deleteFolder = useLibraryStore((s) => s.deleteFolder);
  const moveAsset = useLibraryStore((s) => s.moveAsset);

  const renameAsset = useLibraryStore((s) => s.renameAsset);
  const deleteAsset = useLibraryStore((s) => s.deleteAsset);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favoriteIds = useLibraryStore((s) => s.favoriteIds);
  const viewMode = useLibraryStore((s) => s.viewMode);
  const setViewMode = useLibraryStore((s) => s.setViewMode);
  const assignAssetProject = useLibraryStore((s) => s.assignAssetProject);
  const assetProject = useLibraryStore((s) => s.assetProject);
  const projects = useWorkspaceStore((s) => s.projects);

  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>(LIBRARY_ROOT_ID);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set([LIBRARY_ROOT_ID]),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [assetRenameValue, setAssetRenameValue] = useState("");
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      { label: "Total assets", value: assets.length },
      { label: "Audio", value: assets.filter((a) => a.kind === "audio").length },
      { label: "MIDI", value: assets.filter((a) => a.kind === "midi").length },
      { label: "Presets", value: assets.filter((a) => a.kind === "preset").length },
    ],
    [assets],
  );

  const onDragStartAsset = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/soundai-asset-id", assetId);
  };
  const onDragOverFolder = (e: React.DragEvent, folderId: string) => {
    if (e.dataTransfer.types.includes("text/soundai-asset-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverFolder(folderId);
    }
  };
  const onDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/soundai-asset-id");
    if (id) moveAsset(id, folderId);
    setDragOverFolder(null);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return assets.filter((a: LibraryAsset) => {
      const fid = assetFolder[a.id] ?? LIBRARY_ROOT_ID;
      if (selectedFolder !== LIBRARY_ROOT_ID && fid !== selectedFolder) return false;
      if (selectedProject !== "all") {
        const pid = assetProject[a.id] ?? null;
        if (pid !== selectedProject) return false;
      }
      if (type !== "all" && a.kind !== type) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.tags.some((tag) => tag.includes(q));
    });
  }, [assets, assetFolder, assetProject, selectedFolder, selectedProject, type, query]);

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };
  const commitRename = () => {
    if (renamingId) renameFolder(renamingId, renameValue);
    setRenamingId(null);
    setRenameValue("");
  };

  const onCreateFolder = () => {
    const id = addFolder(`Folder ${folders.length}`);
    setExpandedFolders((prev) => new Set(prev).add(id));
    setSelectedFolder(id);
    startRename(id, `Folder ${folders.length}`);
  };

  const onDeleteFolder = (id: string) => {
    deleteFolder(id);
    if (selectedFolder === id) setSelectedFolder(LIBRARY_ROOT_ID);
  };

  const countFor = (fid: string) =>
    assets.filter((a) => (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === fid).length;

  const openInEditor = (asset: LibraryAsset) => {
    setEditorIntent({ assetId: asset.id, kind: asset.kind, title: asset.title });
    navigate("/app/editor");
  };

  const commitAssetRename = () => {
    if (renamingAssetId) renameAsset(renamingAssetId, assetRenameValue);
    setRenamingAssetId(null);
    setAssetRenameValue("");
  };

  return (
    <WorkspacePageShell
      title={t("library.title")}
      subtitle={t("library.subtitle")}
      stats={stats}
      actions={<ViewModeToggle value={viewMode} onChange={setViewMode} />}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="premium-library-sidebar flex flex-col gap-2 rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-4 shadow-[var(--ui-shadow-soft)]">
          <div className="flex items-center justify-between">
            <h3 className="font-codec text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Folders
            </h3>
            <button type="button" onClick={onCreateFolder} className="premium-icon-btn h-8 w-auto px-2 text-[11px]">
              <FolderPlus className="h-3.5 w-3.5" /> New
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {folders.map((f) => {
              const isRoot = f.id === LIBRARY_ROOT_ID;
              const active = selectedFolder === f.id;
              const expanded = expandedFolders.has(f.id);
              const renaming = renamingId === f.id;
              const isDragTarget = dragOverFolder === f.id;
              return (
                <div key={f.id} className="flex flex-col">
                  <div
                    onDragOver={(e) => onDragOverFolder(e, f.id)}
                    onDragLeave={() => setDragOverFolder(null)}
                    onDrop={(e) => onDropOnFolder(e, f.id)}
                    className={`group flex items-center gap-1 rounded-[10px] px-2 py-1.5 font-codec text-xs transition-colors ${
                      isDragTarget
                        ? "bg-primary/15 text-primary ring-1 ring-primary"
                        : active
                          ? "bg-primary/10 text-primary"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                    }`}
                  >
                    <button type="button" onClick={() => toggleFolder(f.id)} className="shrink-0 opacity-50 hover:opacity-100">
                      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                    <FolderIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : ""}`} />
                    {renaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="app-input h-6 flex-1 px-1 py-0 text-xs"
                      />
                    ) : (
                      <button type="button" onClick={() => setSelectedFolder(f.id)} className="flex-1 truncate text-left">
                        {f.name}
                      </button>
                    )}
                    <span className="font-codec text-[10px] opacity-40">{countFor(f.id)}</span>
                    {!isRoot && !renaming && (
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={() => startRename(f.id, f.name)} className="premium-icon-btn h-6 w-6">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => onDeleteFolder(f.id)} className="premium-icon-btn h-6 w-6">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {renaming && (
                      <div className="flex shrink-0 items-center">
                        <button type="button" onClick={commitRename} className="premium-icon-btn h-6 w-6 text-primary">
                          <Check className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => setRenamingId(null)} className="premium-icon-btn h-6 w-6">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {expanded && (
                    <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--border-primary)] pl-2">
                      {assets
                        .filter((a) => (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === f.id)
                        .map((a) => (
                          <FolderFilePlayer key={a.id} asset={a} />
                        ))}
                      {countFor(f.id) === 0 && (
                        <div className="px-2 py-0.5 font-codec text-[11px] text-[var(--text-muted)]">empty</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 font-codec text-[11px] italic text-[var(--text-muted)]">
            Tip: drag items into folders or use the move button on each card to organize assets for faster export.
          </p>

          <div className="mt-4 border-t border-[var(--border-primary)] pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-codec text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Projects
              </h3>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setSelectedProject("all")}
                className={`rounded-[8px] px-2 py-1.5 text-left font-codec text-xs ${
                  selectedProject === "all" ? "bg-primary/10 text-primary" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                All projects
              </button>
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProject(project.id)}
                  className={`truncate rounded-[8px] px-2 py-1.5 text-left font-codec text-xs ${
                    selectedProject === project.id
                      ? "bg-primary/10 text-primary"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="premium-toolbar mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setType(filter.value)}
                  className={`premium-filter-chip ${filter.value === type ? "is-active" : ""}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="relative max-w-sm flex-1 md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search library…"
                className="app-input premium-search pl-10"
              />
            </div>
          </div>

          <div className={viewMode === "grid" ? "premium-library-grid" : "flex flex-col gap-2"}>
            {filtered.map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={(e) => onDragStartAsset(e, a.id)}
                className={`premium-library-card-wrap relative cursor-grab active:cursor-grabbing ${viewMode === "list" ? "rounded-[14px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-2" : ""}`}
              >
                {renamingAssetId === a.id ? (
                  <div className="flex items-center gap-2 p-3">
                    <input
                      autoFocus
                      value={assetRenameValue}
                      onChange={(e) => setAssetRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitAssetRename();
                        if (e.key === "Escape") setRenamingAssetId(null);
                      }}
                      className="app-input h-8 flex-1 text-xs"
                    />
                    <button type="button" onClick={commitAssetRename} className="premium-icon-btn h-8 w-8 text-primary">
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <ResultCard
                    item={toCardItem(a)}
                    savedToLibrary
                    variant="library"
                    onEdit={() => openInEditor(a)}
                  />
                )}
                <div className="absolute right-5 top-5 z-10 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(a.id)}
                    className={`premium-asset-action h-7 w-7 ${favoriteIds.includes(a.id) ? "text-primary" : ""}`}
                    aria-label="Favorite"
                  >
                    <Star className={`h-3 w-3 ${favoriteIds.includes(a.id) ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingAssetId(a.id);
                      setAssetRenameValue(a.title);
                    }}
                    className="premium-asset-action h-7 w-7"
                    aria-label="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAsset(a.id)}
                    className="premium-asset-action h-7 w-7"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoveMenuFor(moveMenuFor === a.id ? null : a.id)}
                    className="premium-asset-action h-7 px-2 text-[10px]"
                  >
                    <FolderIcon className="h-3 w-3" />
                    Move
                  </button>
                  {moveMenuFor === a.id && (
                    <div className="absolute right-0 top-8 z-20 w-52 rounded-[14px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] p-1 shadow-[var(--ui-shadow-floating)]">
                      {folders.map((f) => {
                        const current = (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              moveAsset(a.id, f.id);
                              setMoveMenuFor(null);
                            }}
                            className={`flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left font-codec text-xs transition-colors ${
                              current
                                ? "bg-primary/10 text-primary"
                                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                            }`}
                          >
                            <FolderIcon className="h-3 w-3" />
                            <span className="flex-1 truncate">{f.name}</span>
                            {current && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-[var(--border-primary)]" />
                      {projects.map((project) => {
                        const current = assetProject[a.id] === project.id;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              assignAssetProject(a.id, current ? null : project.id);
                              setMoveMenuFor(null);
                            }}
                            className={`flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left font-codec text-xs transition-colors ${
                              current
                                ? "bg-primary/10 text-primary"
                                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                            }`}
                          >
                            <Briefcase className="h-3 w-3" />
                            <span className="flex-1 truncate">{project.name}</span>
                            {current && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="premium-empty rounded-[18px] border border-dashed border-[var(--border-primary)] p-10 text-center font-codec text-sm text-[var(--text-secondary)]">
              No assets match your filters.
            </div>
          )}
        </div>
      </div>
    </WorkspacePageShell>
  );
}

export default function Library() {
  const { t } = useLanguage();
  const { mode } = useInterfaceMode();

  if (mode !== "pro") {
    return (
      <ProGate
        title={t("library.title")}
        subtitle={t("library.subtitle")}
        feature="Library organizes your generated audio, MIDI, and preset assets across folders."
      />
    );
  }

  return <LibraryWorkspace />;
}
