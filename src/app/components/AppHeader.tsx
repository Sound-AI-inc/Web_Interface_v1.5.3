import { Bell, Coins } from "lucide-react";
import ThemedLogo from "./ThemedLogo";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

const CREDITS_REMAINING = 42;
const CREDITS_TOTAL = 50;

export default function AppHeader() {
  const { mode, setMode } = useInterfaceMode();
  const creditsLow = CREDITS_REMAINING / CREDITS_TOTAL < 0.2;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] bg-[var(--background-primary)] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <ThemedLogo />
        </div>
        <span className="truncate font-syne text-[17px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          SoundAI
        </span>
      </div>

      <div className="mode-toggle" aria-label="Product mode">
        {(["lite", "pro"] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            className="mode-toggle-button"
            data-active={mode === nextMode ? "true" : "false"}
            onClick={() => setMode(nextMode)}
          >
            {nextMode === "lite" ? "Lite" : "Pro"}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <div
          className={`credits-pill flex items-center gap-2 ${creditsLow ? "credits-pill--low" : ""}`}
          title={creditsLow ? "Low credits — upgrade plan" : undefined}
        >
          <Coins className="h-4 w-4 text-primary" />
          <span>
            <span className={creditsLow ? "text-primary" : ""}>{CREDITS_REMAINING}</span>{" "}
            <span className="text-[var(--text-secondary)]">Credits</span>
          </span>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="composer-control flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-accent"
          aria-hidden
        >
          D
        </div>
      </div>
    </header>
  );
}
