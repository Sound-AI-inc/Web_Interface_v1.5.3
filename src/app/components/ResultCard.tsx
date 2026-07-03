import {
  Heart,
  KeyboardMusic,
  Pencil,
  Play,
  Repeat,
  SlidersHorizontal,
  Star,
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
  bpm?: number | null;
  key?: string | null;
  genre?: string | null;
}

interface ResultCardProps {
  item: ResultCardItem;
  onAddToLibrary?: () => void;
  onRemix?: () => void;
  onEdit?: () => void;
  onToggleFavorite?: () => void;
  savedToLibrary?: boolean;
  favorited?: boolean;
  saveLabel?: string;
  statusLabel?: string;
  statusProgress?: number;
  disableActions?: boolean;
  variant?: "feed" | "library";
  footer?: React.ReactNode;
}

const kindCopy: Record<ResultKind, { label: string; icon: typeof Play }> = {
  audio: { label: "Audio", icon: Play },
  midi: { label: "MIDI", icon: KeyboardMusic },
  preset: { label: "Preset", icon: SlidersHorizontal },
};

export default function ResultCard({
  item,
  onAddToLibrary,
  onRemix,
  onEdit,
  onToggleFavorite,
  savedToLibrary,
  favorited,
  saveLabel,
  statusLabel,
  statusProgress,
  disableActions,
  variant = "feed",
  footer,
}: ResultCardProps) {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";
  const isFeed = variant === "feed";
  const Icon = kindCopy[item.kind].icon;
  const meta = buildMetadata(item);

  if (isFeed) {
    return (
      <article className="conversation-artifact asset-enter" data-kind={item.kind} data-pro={isPro ? "true" : "false"}>
        {statusLabel && (
          <div className="conversation-artifact-status">
            <span>{statusLabel}</span>
            {typeof statusProgress === "number" && statusProgress < 1 && (
              <div className="conversation-artifact-progress">
                <div style={{ width: `${Math.max(8, Math.round(statusProgress * 100))}%` }} />
              </div>
            )}
          </div>
        )}

        <div className="conversation-artifact-body">
          <div className="conversation-artifact-heading">
            <span className="conversation-artifact-kind">
              <Icon className="h-3 w-3" />
              {kindCopy[item.kind].label}
            </span>
            <h3 className="conversation-artifact-title">{item.title}</h3>
            {item.description && (
              <p className="conversation-artifact-description">{item.description}</p>
            )}
          </div>

          <div className="conversation-artifact-preview">
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

          <div className="conversation-artifact-meta">
            {meta.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>

          <div className="conversation-artifact-actions">
            <ArtifactAction
              disabled={savedToLibrary || disableActions}
              icon={Heart}
              label={saveLabel ?? (savedToLibrary ? "Saved" : "Save")}
              active={savedToLibrary}
              onClick={onAddToLibrary}
            />
            <ArtifactAction disabled={disableActions} icon={Repeat} label="Reuse" onClick={onRemix} />
            {onToggleFavorite && (
              <ArtifactAction
                disabled={disableActions}
                icon={Star}
                label={favorited ? "Favorited" : "Favorite"}
                active={favorited}
                onClick={onToggleFavorite}
              />
            )}
            {isPro && onEdit && (
              <ArtifactAction disabled={disableActions} icon={Pencil} label="Edit" onClick={onEdit} />
            )}
          </div>

          {footer && <div className="conversation-artifact-footer">{footer}</div>}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`premium-asset-card asset-enter premium-asset-card-library`}
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

function ArtifactAction({
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
      className={`conversation-artifact-action ${active ? "is-active" : ""}`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? "fill-primary text-primary" : ""}`} />
      {label}
    </button>
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
  const duration = formatDuration(item.durationSeconds);

  if (item.kind === "audio") {
    const parts = [item.format, duration];
    if (item.bpm) parts.splice(1, 0, `${item.bpm} BPM`);
    if (item.key) parts.splice(item.bpm ? 2 : 1, 0, item.key);
    return parts.filter(Boolean);
  }

  if (item.kind === "midi") {
    return [
      item.key ?? "Key —",
      `${Math.max(1, Math.round(item.durationSeconds / 2))} bars`,
      duration,
    ];
  }

  return [item.format, item.genre ?? item.tags?.[0] ?? "Preset", duration];
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
    bpm: item.metadata?.bpm ?? item.metadata?.estimatedTempo ?? null,
    key: item.metadata?.key ?? item.metadata?.keySignatureHint ?? null,
    genre: item.metadata?.genreTags?.[0] ?? item.metadata?.soundType ?? null,
  };
  if ("description" in item) base.description = item.description;
  return base;
}
