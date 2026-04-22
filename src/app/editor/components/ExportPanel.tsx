import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Folder as FolderIcon,
} from "lucide-react";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../../state/libraryStore";

/**
 * Compact "Export" subpanel pinned at the bottom of the Editor Mode right
 * sidebar. Shows library folders → files so the user can queue an export
 * to their local DAW / file system.
 */
export default function ExportPanel() {
  const folders = useLibraryStore((s) => s.folders);
  const assets = useLibraryStore((s) => s.assets);
  const assetFolder = useLibraryStore((s) => s.assetFolder);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([LIBRARY_ROOT_ID]),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assetsFor = (fid: string) =>
    assets.filter((a) => (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === fid);

  return (
    <section className="app-card flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <h3 className="app-section-title">Export</h3>
        <span className="font-codec text-[10px] text-text/40">
          {assets.length} items
        </span>
      </header>

      <p className="font-codec text-[11px] italic text-text/50">
        Push files from your library straight to your DAW or local disk.
      </p>

      <div className="flex flex-col gap-1">
        {folders.map((f) => {
          const isOpen = expanded.has(f.id);
          const items = assetsFor(f.id);
          return (
            <div key={f.id} className="rounded-button border border-surface">
              <button
                type="button"
                onClick={() => toggle(f.id)}
                className="flex w-full items-center gap-2 px-2 py-1.5 font-codec text-xs text-text/80 transition-colors hover:bg-surface-muted"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-text/50" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-text/50" />
                )}
                <FolderIcon className="h-3.5 w-3.5 shrink-0 text-text/50" />
                <span className="flex-1 truncate text-left">{f.name}</span>
                <span className="font-codec text-[10px] text-text/40">
                  {items.length}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-surface">
                  {items.length === 0 ? (
                    <div className="px-3 py-2 font-codec text-[11px] italic text-text/40">
                      empty
                    </div>
                  ) : (
                    items.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 border-b border-surface/60 px-3 py-1.5 last:border-b-0"
                      >
                        <span className="flex-1 truncate font-codec text-[11px] text-text/70">
                          {a.title}
                        </span>
                        <span className="shrink-0 font-poppins text-[9px] uppercase tracking-wider text-text/40">
                          {a.format}
                        </span>
                        <button
                          type="button"
                          className="inline-flex h-6 items-center gap-1 rounded-button bg-primary px-2 font-codec text-[10px] text-white transition-colors hover:bg-primary/90"
                          title="Export"
                        >
                          <Download className="h-3 w-3" />
                          Export
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
