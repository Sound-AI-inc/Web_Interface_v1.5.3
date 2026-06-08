import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Outlet, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import AppHeader from "./components/AppHeader";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import AnimatedBackground from "./components/AnimatedBackground";
import SettingsContent from "./components/SettingsContent";
import UpgradePlanModalContent from "./components/UpgradePlanModalContent";
import { InterfaceModeContext, type InterfaceMode } from "./hooks/useInterfaceMode";
import { LanguageProvider } from "./i18n/LanguageProvider";

export default function AppLayout() {
  const [mode, setMode] = useState<InterfaceMode>("pro");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const toggle = useCallback(
    () => setMode((m) => (m === "pro" ? "lite" : "pro")),
    [],
  );
  const ctx = useMemo(() => ({ mode, setMode, toggle }), [mode, toggle]);
  const location = useLocation();
  const isWorkspaceRoute = location.pathname.includes("/generator");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pro", "theme-lite");
    root.classList.add(mode === "pro" ? "theme-pro" : "theme-lite");
    root.setAttribute("data-theme", mode === "pro" ? "pro" : "lite");
  }, [mode]);

  return (
    <LanguageProvider>
      <InterfaceModeContext.Provider value={ctx}>
        <AnimatedBackground />
        <div
          data-theme={mode === "pro" ? "pro" : "lite"}
          className={`relative flex h-screen min-h-0 overflow-hidden bg-transparent font-codec text-text ${
            mode === "pro" ? "theme-pro" : "theme-lite"
          }`}
        >
          <Sidebar
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenUpgrade={() => setUpgradeModalOpen(true)}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <AppHeader />
            <main
              className={`min-h-0 flex-1 bg-[var(--background-primary)] ${
                isWorkspaceRoute ? "overflow-hidden" : "token-scroll overflow-y-auto"
              }`}
            >
              <ErrorBoundary fallbackTitle="Workspace failed to load">
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>
          <ShellModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} widthClassName="max-w-[1040px]">
            <SettingsContent onSave={() => setSettingsModalOpen(false)} compact />
          </ShellModal>
          <ShellModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} widthClassName="max-w-[1240px]">
            <UpgradePlanModalContent />
          </ShellModal>
        </div>
      </InterfaceModeContext.Provider>
    </LanguageProvider>
  );
}

function ShellModal({
  open,
  onClose,
  children,
  widthClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName: string;
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="shell-modal-root fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: "var(--z-modal)" }}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="token-overlay absolute inset-0"
        onClick={onClose}
      />
      <div className={`relative max-h-[88vh] w-full overflow-hidden ${widthClassName}`} style={{ zIndex: 1 }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-floating)] text-[var(--text-secondary)] transition-colors hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="shell-modal-panel token-modal token-scroll max-h-[88vh] overflow-y-auto rounded-[24px] border border-[var(--border-primary)] p-2 shadow-[var(--ui-shadow-floating)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
