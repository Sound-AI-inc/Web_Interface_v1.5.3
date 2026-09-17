import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Coins, Menu } from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";
import { useCredits } from "../hooks/useCredits";
import { useAuth } from "../hooks/useAuth";

export default function AppHeader({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const { mode, setMode } = useInterfaceMode();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { remaining, low, loading } = useCredits();
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Account";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const initial = displayName.charAt(0).toUpperCase() || "S";
  // Notifications will be connected to real data source when available.
  // Currently shows truthful empty state.
  const notifications: Array<{ id: string; title: string; body: string; time: string; read?: boolean }> = [];
  const unreadCount = 0;

  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [notificationsOpen]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--border-primary)] bg-[var(--background-primary)] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-button text-[var(--text-secondary)] transition-colors hover:bg-[var(--ui-input)] hover:text-text md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
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
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            aria-label={t("header.notifications")}
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              if (!notificationsOpen) {
                window.setTimeout(() => {
                  setReadIds(new Set(notifications.map((item) => item.id)));
                }, 700);
              }
            }}
            className="composer-control relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.65)]" />
            )}
          </button>
          {notificationsOpen && (
            <div className="notification-center absolute right-0 top-11 z-50 w-[340px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-[var(--ui-shadow-floating)]">
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3">
                <h2 className="font-codec text-sm font-semibold text-[var(--text-primary)]">
                  Notifications
                </h2>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {unreadCount} unread
                </span>
              </div>
              <div className="token-scroll max-h-[360px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center font-codec text-sm text-[var(--text-secondary)]">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => {
                    const unread = !readIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setReadIds((prev) => new Set(prev).add(item.id))}
                        className="flex w-full gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-secondary)]"
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            unread ? "bg-primary" : "bg-[var(--border-primary)]"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-codec text-[13px] font-semibold text-[var(--text-primary)]">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block truncate font-codec text-[12px] text-[var(--text-secondary)]">
                            {item.body}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                          {item.time}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-t border-[var(--border-primary)] p-2">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate("/app/notifications");
                  }}
                  className="flex w-full items-center justify-center rounded-[12px] px-3 py-2 font-codec text-[12px] font-semibold text-primary transition-colors hover:bg-[var(--surface-secondary)]"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-accent overflow-hidden"
          aria-hidden
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
      </div>
    </header>
  );
}
