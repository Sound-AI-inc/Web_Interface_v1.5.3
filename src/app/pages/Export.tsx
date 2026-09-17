import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckSquare,
  Download,
  Folder as FolderIcon,
  Search,
  Square,
  MousePointer2,
} from "lucide-react";
import ProGate from "../components/ProGate";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import type { ResultKind, LibraryAsset } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslationKey } from "../i18n/translations";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../state/libraryStore";
import { useWorkspaceStore } from "../state/workspaceStore";

type TypeFilter = "all" | ResultKind;
type SourceTab = "library" | "projects";
type ExportScope = "selected" | "project" | "all";

// UX-002: mirrors the generator Preview disclosure — demo-sourced assets are
// preview-quality, never production masters.
const BACKEND_GENERATED_FROM = new Set([
  "ai-orchestration-api",
  "soundcraft-api",
  "midicraft-api",
  "vstcraft-api",
]);

function isPreviewAsset(asset: { metadata?: { generatedFrom?: string } | null }): boolean {
  return !BACKEND_GENERATED_FROM.has(asset.metadata?.generatedFrom ?? "");
}

// DAW compatibility mapping by asset kind/format
function getDawCompatibility(kind: string, format: string): string[] {
  const daws: string[] = [];
  if (kind === "audio") {
    if (["WAV", "FLAC", "AIFF"].includes(format.toUpperCase())) {
      daws.push("Ableton Live", "FL Studio", "Logic Pro");
    } else if (["MP3", "OGG"].includes(format.toUpperCase())) {
      daws.push("Ableton Live", "FL Studio");
    }
  } else if (kind === "midi") {
    daws.push("Ableton Live", "FL Studio", "Logic Pro");
  } else if (kind === "preset") {
    if (format.toUpperCase().includes("VST")) {
      daws.push("Ableton Live", "FL Studio");
    }
    if (format.toUpperCase().includes("AU") || format.toUpperCase().includes("LOGIC")) {
      daws.push("Logic Pro");
    }
  }
  return [...new Set(daws)];
}

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio" },
  { value: "midi", label: "MIDI" },
  { value: "preset", label: "Preset" },
];

function ExportRow({
  asset,
  isSelected,
  isPreview,
  projectName,
  dawCompat,
  onToggle,
  t,
}: {
  asset: LibraryAsset;
  isSelected: boolean;
  isPreview: boolean;
  projectName: string;
  dawCompat: string[];
  onToggle: (id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/soundai-asset-id", asset.id);
    e.dataTransfer.setData("text/soundai-asset-title", asset.title);
    e.dataTransfer.setData("text/soundai-asset-kind", asset.kind);
    e.dataTransfer.setData("text/soundai-asset-format", asset.format);
    setDragOver(true);
  };

  const handleDragEnd = () => {
    setDragOver(false);
  };

  return (
    <div
      key={asset.id}
      className="premium-export-row"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => setDragOver(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(asset.id)}
        className={`shrink-0 ${isSelected ? "text-primary" : "text-[var(--text-muted)]"}`}
        aria-label={isSelected ? `Deselect ${asset.title}` : `Select ${asset.title}`}
        aria-pressed={isSelected}
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
        {dawCompat.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {dawCompat.map((daw, idx) => (
              <span
                key={idx}
                className="premium-chip px-2 py-0.5 font-codec text-[10px] bg-primary/10 text-primary border-primary/20"
              >
                {daw}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        className="hidden w-[92px] shrink-0 font-codec text-[11px] text-[var(--text-muted)] sm:block"
        title={
          isPreview
            ? "Preview — demo synthesis, not a production master."
            : undefined
        }
      >
        {isPreview ? "Preview" : "Ready"}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(asset.id)}
          title={
            isPreview
              ? "Preview-quality asset — demo synthesis, not a production master."
              : undefined
          }
          className="premium-asset-action h-8 px-3 text-[11px]"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`premium-asset-action h-8 px-3 text-[11px] ${dragOver ? "bg-primary/10 text-primary" : ""}`}
          title={t("result.dragToDaw")}
          aria-label={t("result.dragToDaw")}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          {t("result.dragToDaw")}
        </button>
      </div>
    </div>
  );
}

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
            aria-label="Export scope"
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
              aria-label="Export project"
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
              aria-label={t("export.search")}
              className="app-input premium-search pl-10"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {groups.some((group) => group.items.some(isPreviewAsset)) && (
          <p className="rounded-[12px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2.5 font-codec text-[12px] leading-5 text-[var(--text-secondary)]">
            Assets marked Preview are demo synthesis, not production masters. Backend
            inference is not yet connected.
          </p>
        )}
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
                      const isPreview = isPreviewAsset(asset);
                      const projectName =
                        projects.find((project) => project.id === assetProject[asset.id])?.name ?? "Unassigned";
                      const dawCompat = getDawCompatibility(asset.kind, asset.format);

                      return (
                        <ExportRow
                          key={asset.id}
                          asset={asset}
                          isSelected={isSelected}
                          isPreview={isPreview}
                          projectName={projectName}
                          dawCompat={dawCompat}
                          onToggle={toggle}
                          t={t}
                        />
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
