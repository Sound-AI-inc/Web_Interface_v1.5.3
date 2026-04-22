import { useState } from "react";
import { Folder as FolderIcon } from "lucide-react";
import type { ResultKind } from "../../data/mock";
import { LIBRARY_ROOT_ID, useLibraryStore } from "../../state/libraryStore";
import type { MidiNote } from "../core/types";
import type { SynthParams } from "../core/types";

interface Props {
  kind: ResultKind;
  trigger: React.ReactElement;
  onImportMidi?: (notes: MidiNote[]) => void;
  onImportPreset?: (params: SynthParams) => void;
  onImportAudio?: (assetId: string, title: string) => void;
}

/**
 * Library picker with folder list → asset list. Filters by asset kind so the
 * user only sees importable items for the current editor tab.
 */
export default function LibraryImportMenu({
  kind,
  trigger,
  onImportMidi,
  onImportPreset,
  onImportAudio,
}: Props) {
  const folders = useLibraryStore((s) => s.folders);
  const assets = useLibraryStore((s) => s.assets);
  const assetFolder = useLibraryStore((s) => s.assetFolder);
  const [open, setOpen] = useState(false);
  const [folderId, setFolderId] = useState<string>(LIBRARY_ROOT_ID);

  const assetsForFolder = (fid: string) =>
    assets.filter(
      (a) =>
        a.kind === kind &&
        (fid === LIBRARY_ROOT_ID ||
          (assetFolder[a.id] ?? LIBRARY_ROOT_ID) === fid),
    );

  const doImport = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;
    if (asset.kind === "midi" && asset.notes && onImportMidi) {
      const notes: MidiNote[] = asset.notes.map((n, i) => ({
        id: `lib-${assetId}-${i}`,
        pitch: n.pitch,
        start: n.start,
        duration: n.duration,
        velocity: n.velocity ?? 0.8,
      }));
      onImportMidi(notes);
    } else if (asset.kind === "preset" && asset.preset && onImportPreset) {
      onImportPreset({
        attack: asset.preset.attack,
        decay: asset.preset.decay,
        sustain: asset.preset.sustain,
        release: asset.preset.release,
        filterCutoff: asset.preset.filterCutoff,
        filterResonance: asset.preset.filterResonance,
        lfoRate: 2,
        lfoDepth: 0,
      });
    } else if (asset.kind === "audio" && onImportAudio) {
      onImportAudio(asset.id, asset.title);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-72 rounded-card border border-surface bg-white p-2 shadow-flat">
          <div className="mb-2 flex flex-wrap gap-1">
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFolderId(f.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-codec text-[10px] transition-colors ${
                  folderId === f.id
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-muted text-text/60 hover:bg-surface"
                }`}
              >
                <FolderIcon className="h-3 w-3" />
                {f.name}
              </button>
            ))}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {assetsForFolder(folderId).length === 0 ? (
              <div className="px-2 py-3 font-codec text-xs italic text-text/40">
                No {kind} assets in this folder.
              </div>
            ) : (
              assetsForFolder(folderId).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => doImport(a.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-button px-2 py-1.5 text-left font-codec text-xs text-text/80 transition-colors hover:bg-surface-muted"
                >
                  <span className="truncate">{a.title}</span>
                  <span className="shrink-0 font-poppins text-[10px] uppercase text-text/40">
                    {a.format}
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-button px-2 py-1 font-codec text-[11px] text-text/50 hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
