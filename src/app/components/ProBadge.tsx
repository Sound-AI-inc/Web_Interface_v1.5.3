import { Sparkles } from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

/**
 * ProBadge — visible indicator of the active interface mode.
 * In Pro mode it renders an animated gradient pill with a pulsing ring
 * and a sparkle dot so the user always knows when Pro is active.
 * In Lite mode it renders as a muted, static chip.
 */
export default function ProBadge() {
  const { mode } = useInterfaceMode();

  if (mode === "pro") {
    return (
      <span
        className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1
          bg-size-200 animate-pro-shimmer
          font-poppins text-[10px] font-bold uppercase tracking-[0.16em] text-white
          shadow-flat-sm animate-pro-pulse"
        aria-label="Pro mode active"
        style={{
          backgroundImage:
            "linear-gradient(110deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-soft)) 52%, rgb(var(--color-surface)) 100%)",
        }}
      >
        <Sparkles className="h-3 w-3" />
        Pro
        <span
          aria-hidden
          className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pro-dot"
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-surface bg-surface-muted
        px-3 py-1 font-poppins text-[10px] font-bold uppercase tracking-[0.16em] text-text/50"
      aria-label="Lite mode active"
    >
      Lite
    </span>
  );
}
