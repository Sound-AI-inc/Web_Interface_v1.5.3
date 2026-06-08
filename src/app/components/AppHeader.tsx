import { useNavigate } from "react-router-dom";
import { Bell, Coins } from "lucide-react";
import ThemedLogo from "./ThemedLogo";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";
import { useCredits } from "../hooks/useCredits";

export default function AppHeader() {
  const { mode, setMode } = useInterfaceMode();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { remaining, low, loading } = useCredits();

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
            {nextMode === "lite" ? t("sidebar.lite") : t("sidebar.pro")}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate("/app/billing")}
          className={`credits-pill flex items-center gap-2 ${low ? "credits-pill--low" : ""}`}
          title={low ? t("header.lowCredits") : undefined}
        >
          <Coins className="h-4 w-4 text-primary" />
          <span>
            <span className={low ? "text-primary" : ""}>{loading ? "…" : remaining}</span>{" "}
            <span className="text-[var(--text-secondary)]">{t("generator.credits")}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label={t("header.notifications")}
          onClick={() => navigate("/app/notifications")}
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
