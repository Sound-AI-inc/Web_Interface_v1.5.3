import { useState } from "react";
import {
  Download,
  Heart,
  KeyboardMusic,
  Pencil,
  Play,
  Repeat,
  SlidersHorizontal,
  Star,
  Waves,
  MousePointer2,
} from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import type { AudioResult, LibraryAsset, ResultKind } from "../data/mock";
import AudioPreview from "./previews/AudioPreview";
import MidiPreview from "./previews/MidiPreview";
import PresetPreview from "./previews/PresetPreview";
import { useLanguage } from "../i18n/LanguageProvider";

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
  onDownload?: () => void;
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: () => void;
  onToggleFavorite?: () => void;
  savedToLibrary?: boolean;
  favorited?: boolean;
  saveLabel?: string;
  downloadDisabled?: boolean;
  downloadTitle?: string;
  statusLabel?: string;
  statusProgress?: number;
  disableActions?: boolean;
  variant?: "feed" | "library";
  footer?: React.ReactNode;
}

/** Extensible kind map: new asset types (e.g. MusCraft "mus") plug in here
 *  without rewriting the card. Unknown kinds fall back to audio rendering. */
const kindCopy: Record<ResultKind, { label: string; icon: typeof Play }> = {
  audio: { label: "Audio", icon: Play },
  midi: { label: "MIDI", icon: KeyboardMusic },
  preset: { label: "Preset", icon: SlidersHorizontal },
  mus: { label: "Mus", icon: Waves },
};

export default function ResultCard({
  item,
  onAddToLibrary,
  onRemix,
  onEdit,
  onDownload,
  onToggleFavorite,
  savedToLibrary,
  favorited,
  saveLabel,
  downloadDisabled,
  downloadTitle,
  statusLabel,
  statusProgress,
  disableActions,
  variant = "feed",
  footer,
  onDragStart,
  onDragEnd,
}: ResultCardProps) {
  const { mode } = useInterfaceMode();
  const { t } = useLanguage();
  const isPro = mode === "pro";
  const isFeed = variant === "feed";
  const Icon = (kindCopy[item.kind] ?? kindCopy.audio).icon;
  const kindLabel = (kindCopy[item.kind] ?? kindCopy.audio).label;
  const meta = buildMetadata(item);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/soundai-asset-id", item.id);
    e.dataTransfer.setData("text/soundai-asset-title", item.title);
    e.dataTransfer.setData("text/soundai-asset-kind", item.kind);
    e.dataTransfer.setData("text/soundai-asset-format", item.format);
    setIsDragging(true);
    onDragStart?.(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

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
              {kindLabel}
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
            {item.kind === "mus" && (
              <p className="px-1 py-2 font-codec text-[12px] text-[var(--text-muted)]">
                Mus output preview is not available yet — MusCraft integration is pending.
              </p>
            )}
          </div>

          <div className="conversation-artifact-meta">
            {meta.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
            {onDragStart && (
              <span className="premium-chip ml-2" data-daw-compatible>
                <MousePointer2 className="h-3 w-3" />
                {t("result.dawCompatible")}
              </span>
            )}
          </div>

          <div className="conversation-artifact-actions">
            {onDownload && (
              <span title={downloadTitle}>
                <ArtifactAction
                  disabled={disableActions || downloadDisabled}
                  icon={Download}
                  label="Download"
                  onClick={onDownload}
                />
              </span>
            )}
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
            {onDragStart && (
              <button
                type="button"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                disabled={disableActions}
                className={`conversation-artifact-action ${isDragging ? "is-dragging" : ""}`}
                title={t("result.dragToDaw")}
                aria-label={t("result.dragToDaw")}
              >
                <MousePointer2 className={`h-3.5 w-3.5 ${isDragging ? "text-primary animate-pulse" : ""}`} />
                {isDragging ? t("drag.dragging") : t("result.dragToDaw")}
              </button>
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
            {onDragStart && (
              <span className="premium-chip ml-2" data-daw-compatible>
                <MousePointer2 className="h-3 w-3" />
                {t("result.dawCompatible")}
              </span>
            )}
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
        {item.kind === "mus" && (
          <p className="px-1 py-2 font-codec text-[12px] text-[var(--text-muted)]">
            Mus output preview is not available yet — MusCraft integration is pending.
          </p>
        )}
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
        {onDownload && (
          <span title={downloadTitle}>
            <AssetAction
              disabled={disableActions || downloadDisabled}
              icon={Download}
              label="Download"
              onClick={onDownload}
            />
          </span>
        )}
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
        {onDragStart && (
          <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            disabled={disableActions}
            className={`premium-asset-action ${isDragging ? "is-dragging" : ""}`}
            title={t("result.dragToDaw")}
            aria-label={t("result.dragToDaw")}
          >
            <MousePointer2 className={`h-3.5 w-3.5 ${isDragging ? "text-primary animate-pulse" : ""}`} />
            {isDragging ? t("drag.dragging") : t("result.dragToDaw")}
          </button>
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

  if (item.kind === "mus") {
    return [item.format, item.genre ?? item.tags?.[0] ?? "Mus", duration];
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
