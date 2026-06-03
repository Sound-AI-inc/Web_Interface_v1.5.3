import { Download, Heart, KeyboardMusic, Play, Repeat, SlidersHorizontal } from "lucide-react";
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

const kindCopy: Record<ResultKind, { label: string; icon: typeof Play; action: string }> = {
  audio: { label: "Audio Sample", icon: Play, action: "Play" },
  midi: { label: "MIDI", icon: KeyboardMusic, action: "Preview" },
  preset: { label: "VST Preset", icon: SlidersHorizontal, action: "Open" },
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
  const Icon = kindCopy[item.kind].icon;
  const meta = buildMetadata(item);

  return (
    <div className="asset-card asset-enter rounded-[20px] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--ui-border-soft)] bg-[var(--ui-input)] px-2.5 py-1 font-codec text-[11px] font-semibold uppercase tracking-[0.08em] text-text/60">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {kindCopy[item.kind].label}
          </div>
          <h3 className="truncate font-codec text-[15px] font-semibold text-text">{item.title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-text/50">
            {meta.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>
        </div>
        {statusLabel && (
          <div className="rounded-full bg-primary/10 px-2.5 py-1 font-codec text-[11px] font-semibold text-primary">
            {statusLabel}
          </div>
        )}
      </div>

      <div className="rounded-[16px] border border-[var(--ui-border-soft)] bg-[var(--ui-input)] p-3">
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

      {typeof statusProgress === "number" && statusProgress < 1 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ui-input)]">
          <div
            className="h-full rounded-full bg-[var(--ui-create-gradient)] transition-[width] duration-300"
            style={{ width: `${Math.max(8, Math.round(statusProgress * 100))}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <AssetAction disabled={disableActions} icon={Icon} label={kindCopy[item.kind].action} />
        <AssetAction disabled={disableActions} icon={Download} label={`Download ${downloadExtension(item)}`} />
        <AssetAction
          disabled={savedToLibrary || disableActions}
          icon={Heart}
          label={savedToLibrary ? "Saved" : "Save"}
          active={savedToLibrary}
          onClick={onAddToLibrary}
        />
        <AssetAction disabled={disableActions} icon={Repeat} label="Reuse" onClick={onRemix} />
      </div>
    </div>
  );
}

function AssetAction({
  icon: Icon,
  label,
  disabled,
  active,
  onClick,
}: {
  icon: typeof Play;
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="composer-control inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 font-codec text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className={`h-3.5 w-3.5 ${active ? "fill-primary text-primary" : ""}`} />
      {label}
    </button>
  );
}

function buildMetadata(item: ResultCardItem): string[] {
  if (item.kind === "audio") {
    return [
      `Format: ${item.format}`,
      "BPM: 135",
      "Key: C minor",
      `Duration: ${formatDuration(item.durationSeconds)}`,
    ];
  }

  if (item.kind === "midi") {
    return [
      "Scale: minor",
      "Key: D",
      `Bars: ${Math.max(1, Math.round(item.durationSeconds / 2))}`,
      "Time: 4/4",
    ];
  }

  return [
    "Plugin: SoundAI Synth",
    `Category: ${item.tags?.[0] ?? item.preset?.oscillator ?? "Bass"}`,
    `Format: ${item.format}`,
  ];
}

function downloadExtension(item: ResultCardItem): string {
  if (item.kind === "audio") return item.format.toLowerCase().includes("wav") ? ".wav" : `.${item.format.toLowerCase()}`;
  if (item.kind === "midi") return ".mid";
  return item.format.includes("fxp") ? ".fxp" : ".vstpreset";
}

function formatDuration(s: number): string {
  if (!Number.isFinite(s)) return "";
  if (s < 10) return `${s.toFixed(1)}s`;
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
