import { Download, Pencil, RotateCcw } from "lucide-react";
import WaveformThumb from "./WaveformThumb";
import type { LibraryAsset } from "../data/mock";

interface LibraryItemProps {
  item: LibraryAsset;
  view: "grid" | "list";
}

export default function LibraryItem({ item, view }: LibraryItemProps) {
  const typeColor: Record<LibraryAsset["type"], string> = {
    Audio: "bg-primary/10 text-primary",
    MIDI: "bg-accent-light/40 text-text",
    Preset: "bg-surface-muted text-text/70",
  };

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-card border border-surface bg-white p-3 shadow-flat-sm">
        <WaveformThumb hue={item.waveformHue} className="h-12 w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-poppins text-sm font-semibold text-text">{item.title}</div>
          <div className="app-meta mt-0.5">
            {item.format}
            {item.duration ? ` · ${item.duration}` : ""} · {item.createdAt}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 font-poppins text-[11px] font-medium ${typeColor[item.type]}`}>
          {item.type}
        </span>
        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text" aria-label="Download">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text" aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 hover:bg-surface hover:text-text" aria-label="Reuse">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-3 rounded-card border border-surface bg-white p-4 shadow-flat-sm transition-colors hover:border-primary/30">
      <WaveformThumb hue={item.waveformHue} className="h-28 w-full" />
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-poppins text-sm font-semibold text-text">{item.title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 font-poppins text-[10px] font-medium ${typeColor[item.type]}`}>
            {item.type}
          </span>
        </div>
        <div className="app-meta mt-1">
          {item.format}
          {item.duration ? ` · ${item.duration}` : ""} · {item.createdAt}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {item.tags.map((t) => (
          <span key={t} className="app-chip">
            #{t}
          </span>
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-surface pt-3">
        <button className="app-meta hover:text-primary">Download</button>
        <button className="app-meta hover:text-primary">Reuse</button>
        <button className="app-meta hover:text-primary">Edit</button>
      </div>
    </div>
  );
}
