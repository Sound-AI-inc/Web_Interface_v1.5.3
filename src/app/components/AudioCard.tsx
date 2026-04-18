import { Play } from "lucide-react";
import WaveformThumb from "./WaveformThumb";
import type { AudioResult } from "../data/mock";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

interface AudioCardProps {
  item: AudioResult;
  primaryAction?: string;
  secondaryAction?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export default function AudioCard({
  item,
  primaryAction = "Play",
  secondaryAction,
  onPrimary,
  onSecondary,
}: AudioCardProps) {
  const { mode } = useInterfaceMode();
  const resolvedSecondary =
    secondaryAction ?? (mode === "pro" ? "Save to library" : "Save");

  return (
    <div className="flex items-center gap-4 rounded-card border border-surface bg-white p-4 shadow-flat-sm">
      <WaveformThumb hue={item.waveformHue} className="h-20 w-32 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="font-poppins text-sm font-semibold text-text">{item.title}</div>
        <div className="app-meta mt-0.5">
          {item.model} • {item.durationSeconds}s • {item.format}
        </div>
        <div className="mt-3 rounded-input border border-surface bg-surface-muted px-3 py-2 font-codec text-xs text-text/60">
          {item.description}
        </div>
      </div>

      <div className="flex w-[140px] shrink-0 flex-col gap-2">
        <button type="button" onClick={onPrimary} className="app-btn-ghost h-9 px-3">
          <Play className="h-3.5 w-3.5" />
          <span>{primaryAction}</span>
        </button>
        <button type="button" onClick={onSecondary} className="app-btn-ghost h-9 px-3">
          {resolvedSecondary}
        </button>
      </div>
    </div>
  );
}
