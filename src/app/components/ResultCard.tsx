import {
  Heart,
  KeyboardMusic,
  Pencil,
  Play,
  Repeat,
  SlidersHorizontal,
} from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
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
  onEdit?: () => void;
  savedToLibrary?: boolean;
  saveLabel?: string;
  statusLabel?: string;
  statusProgress?: number;
  disableActions?: boolean;
  variant?: "feed" | "library";
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
  onEdit,
  savedToLibrary,
  saveLabel,
  statusLabel,
  statusProgress,
  disableActions,
  variant = "feed",
}: ResultCardProps) {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";
  const Icon = kindCopy[item.kind].icon;
  const meta = buildMetadata(item);

  return (
    <article
      className={`premium-asset-card asset-enter ${variant === "library" ? "premium-asset-card-library" : "premium-asset-card-feed"}`}
      data-kind={item.kind}
      data-pro={isPro ? "true" : "false"}
    >
      <div className="premium-asset-card-header">
        <div className="min-w-0 flex-1">
          <div className="premium-asset-kind">
            <Icon className="h-3.5 w-3.5" />
            {kindCopy[item.kind].label}
          </div>
          <h3 className="premium-asset-title">{item.title}</h3>
          <div className="premium-asset-meta">
            {meta.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>
        </div>
        {statusLabel && <span className="premium-asset-status">{statusLabel}</span>}
      </div>

      <div className="premium-asset-preview">
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
        <div className="premium-asset-progress">
          <div
            className="premium-asset-progress-bar"
            style={{ width: `${Math.max(8, Math.round(statusProgress * 100))}%` }}
          />
        </div>
      )}

      <div className="premium-asset-actions">
        <AssetAction disabled={disableActions} icon={Icon} label={kindCopy[item.kind].action} />
        <AssetAction
          disabled={savedToLibrary || disableActions}
          icon={Heart}
          label={saveLabel ?? (savedToLibrary ? "Saved" : "Save to Library")}
          active={savedToLibrary}
          onClick={onAddToLibrary}
        />
        <AssetAction disabled={disableActions} icon={Repeat} label="Reuse" onClick={onRemix} />
        {isPro && onEdit && (
          <AssetAction disabled={disableActions} icon={Pencil} label="Edit" onClick={onEdit} />
        )}
      </div>
    </article>
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
      className="premium-asset-action disabled:cursor-not-allowed disabled:opacity-45"
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
