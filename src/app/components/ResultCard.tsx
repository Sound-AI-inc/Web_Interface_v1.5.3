import { Heart, Repeat } from "lucide-react";
import type { AudioResult, LibraryAsset, ResultKind } from "../data/mock";
import AudioPreview from "./previews/AudioPreview";
import MidiPreview from "./previews/MidiPreview";
import PresetPreview from "./previews/PresetPreview";

export interface ResultCardItem {
  id: string;
  title: string;
  kind: ResultKind;
  format: string;
  durationSeconds: number;
  description?: string;
  audioSeed?: number;
  previewUrl?: string | null;
  notes?: AudioResult["notes"];
  preset?: AudioResult["preset"];
  tags?: string[];
  subtitle?: string;
}

interface ResultCardProps {
  item: ResultCardItem;
  onAddToLibrary?: () => void;
  onRemix?: () => void;
  savedToLibrary?: boolean;
  statusLabel?: string;
  statusProgress?: number;
  disableActions?: boolean;
}

const kindLabel: Record<ResultKind, string> = {
  audio: "Audio",
  midi: "MIDI",
  preset: "Preset",
};

const kindBadge: Record<ResultKind, string> = {
  audio: "bg-primary/10 text-primary",
  midi: "bg-accent-light/40 text-text",
  preset: "bg-surface-muted text-text/70",
};

export default function ResultCard({
  item,
  onAddToLibrary,
  onRemix,
  savedToLibrary,
  statusLabel,
  statusProgress,
  disableActions,
}: ResultCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-surface bg-white p-4 shadow-flat-sm">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-poppins text-[10px] font-semibold uppercase tracking-[0.08em] ${kindBadge[item.kind]}`}
            >
              {kindLabel[item.kind]}
            </span>
            <h3 className="truncate font-poppins text-sm font-semibold text-text">{item.title}</h3>
            {statusLabel && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-poppins text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                {statusLabel}
              </span>
            )}
          </div>
          <div className="app-meta mt-0.5 truncate">
            {(item.subtitle ?? `${item.format} · ${formatDuration(item.durationSeconds)}`) +
              (item.description ? ` · ${item.description}` : "")}
          </div>
          {typeof statusProgress === "number" && statusProgress < 1 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-300"
                style={{ width: `${Math.max(8, Math.round(statusProgress * 100))}%` }}
              />
            </div>
          )}
          <div className="mt-3">
            {item.kind === "audio" && (
              <AudioPreview
                seed={item.audioSeed ?? 1}
                audioUrl={item.previewUrl ?? undefined}
                durationSeconds={item.durationSeconds}
              />
            )}
            {item.kind === "midi" && item.notes && (
              <MidiPreview notes={item.notes} durationSeconds={item.durationSeconds} />
            )}
            {item.kind === "preset" && item.preset && <PresetPreview preset={item.preset} />}
          </div>
        </div>
      </div>

      <div className="flex w-[148px] shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={onAddToLibrary}
          className="app-btn-ghost h-9 px-3"
          disabled={savedToLibrary || disableActions}
          title={savedToLibrary ? "Already in library" : "Add to library"}
        >
          <Heart className={`h-3.5 w-3.5 ${savedToLibrary ? "fill-primary text-primary" : ""}`} />
          <span>{savedToLibrary ? "In library" : "Add to library"}</span>
        </button>
        <button
          type="button"
          onClick={onRemix}
          className="app-btn-ghost h-9 px-3"
          disabled={disableActions}
        >
          <Repeat className="h-3.5 w-3.5" />
          <span>Remix</span>
        </button>
      </div>
    </div>
  );
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s)) return "";
  const m = Math.floor(s / 60);
  const rest = Math.round(s % 60);
  return `${m}:${rest.toString().padStart(2, "0")}`;
}

export function toCardItem(item: AudioResult | LibraryAsset): ResultCardItem {
  const base: ResultCardItem = {
    id: item.id,
    title: item.title,
    kind: item.kind,
    format: item.format,
    durationSeconds: item.durationSeconds,
    audioSeed: item.audioSeed,
    previewUrl: item.metadata?.previewUrl ?? item.metadata?.assetUrl ?? undefined,
    notes: item.notes,
    preset: item.preset,
    tags: item.tags,
  };
  if ("description" in item) base.description = item.description;
  return base;
}
