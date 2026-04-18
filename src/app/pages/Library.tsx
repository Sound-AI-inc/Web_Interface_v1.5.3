import { useMemo, useState } from "react";
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
} from "lucide-react";
import PageContainer from "../components/PageContainer";
import ResultCard, { toCardItem } from "../components/ResultCard";
import type { LibraryAsset, ResultKind } from "../data/mock";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useLanguage } from "../i18n/LanguageProvider";

type TypeFilter = "all" | ResultKind;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

export default function Library() {
  const { t } = useLanguage();
  const folders = useLibraryStore((s) => s.folders);
  const assets = useLibraryStore((s) => s.assets);
  const assetFolder = useLibraryStore((s) => s.assetFolder);
  const addFolder = useLibraryStore((s) => s.addFolder);
  const renameFolder = useLibraryStore((s) => s.renameFolder);
  const deleteFolder = useLibraryStore((s) => s.deleteFolder);
  const moveAsset = useLibraryStore((s) => s.moveAsset);

  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>(LIBRARY_ROOT_ID);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set([LIBRARY_ROOT_ID]),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

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
      if (type !== "all" && a.kind !== type) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q))
      );
    });
  }, [assets, assetFolder, selectedFolder, type, query]);

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

  return (
    <PageContainer title={t("library.title")} subtitle={t("library.subtitle")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Folders sidebar */}
        <aside className="app-card flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="app-section-title">Folders</h3>
            <button
              type="button"
              onClick={onCreateFolder}
              className="app-btn-ghost h-8 px-2 text-[11px]"
              title="Create folder"
            >
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
                    className={`group flex items-center gap-1 rounded-button px-2 py-1.5 font-codec text-xs transition-colors ${
                      isDragTarget
                        ? "bg-primary/15 text-primary ring-1 ring-primary"
                        : active
                          ? "bg-primary/10 text-primary"
                          : "text-text/70 hover:bg-surface-muted"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFolder(f.id)}
                      className="shrink-0 text-text/40 hover:text-text"
                      aria-label={expanded ? "Collapse" : "Expand"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                    <FolderIcon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        active ? "text-primary" : "text-text/50"
                      }`}
                    />
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
                      <button
                        type="button"
                        onClick={() => setSelectedFolder(f.id)}
                        className="flex-1 truncate text-left"
                      >
                        {f.name}
                      </button>
                    )}
                    <span className="font-codec text-[10px] text-text/40">
                      {countFor(f.id)}
                    </span>
                    {!isRoot && !renaming && (
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startRename(f.id, f.name)}
                          className="rounded p-1 text-text/50 hover:bg-surface hover:text-text"
                          aria-label="Rename folder"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteFolder(f.id)}
                          className="rounded p-1 text-text/50 hover:bg-surface hover:text-primary"
                          aria-label="Delete folder"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {renaming && (
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={commitRename}
                          className="rounded p-1 text-primary hover:bg-primary/10"
                          aria-label="Confirm rename"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="rounded p-1 text-text/50 hover:bg-surface"
                          aria-label="Cancel rename"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {expanded && (
                    <div className="ml-6 mt-0.5 flex flex-col gap-0.5">
                      {assets
                        .filter(
                          (a) =>
                            (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === f.id,
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-1 truncate rounded px-2 py-0.5 font-codec text-[11px] text-text/50"
                          >
                            <span className="truncate">{a.title}</span>
                          </div>
                        ))}
                      {countFor(f.id) === 0 && (
                        <div className="px-2 py-0.5 font-codec text-[11px] text-text/30">
                          empty
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-2 font-codec text-[11px] italic text-text/40">
            Tip: drag items into folders or use the move button on each card to
            organize assets for faster export.
          </p>
        </aside>

        {/* Assets list */}
        <div>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`h-9 rounded-full px-3 font-codec text-xs transition-colors ${
                    t.value === type
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-muted text-text/60 hover:bg-surface"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search library…"
                  className="app-input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={(e) => onDragStartAsset(e, a.id)}
                className="relative cursor-grab active:cursor-grabbing"
              >
                <ResultCard item={toCardItem(a)} savedToLibrary />
                <div className="absolute right-4 top-4 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setMoveMenuFor(moveMenuFor === a.id ? null : a.id)
                    }
                    className="app-btn-ghost h-7 px-2 text-[10px]"
                    title="Move to folder"
                  >
                    <FolderIcon className="h-3 w-3" />
                    Move
                  </button>
                  {moveMenuFor === a.id && (
                    <div className="absolute right-0 top-8 z-20 w-52 rounded-card border border-surface bg-white p-1 shadow-flat">
                      {folders.map((f) => {
                        const current =
                          (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              moveAsset(a.id, f.id);
                              setMoveMenuFor(null);
                            }}
                            className={`flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-left font-codec text-xs transition-colors ${
                              current
                                ? "bg-primary/10 text-primary"
                                : "text-text/70 hover:bg-surface-muted"
                            }`}
                          >
                            <FolderIcon className="h-3 w-3" />
                            <span className="flex-1 truncate">{f.name}</span>
                            {current && <Check className="h-3 w-3" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-card border border-surface bg-surface-muted p-8 text-center font-codec text-sm text-text/60">
                No assets match your filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
