import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import AppHeader from "./components/AppHeader";
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
          className={`relative flex min-h-screen bg-transparent font-codec text-text ${
            mode === "pro" ? "theme-pro" : "theme-lite"
          }`}
        >
          <Sidebar
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenUpgrade={() => setUpgradeModalOpen(true)}
          />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <Outlet />
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close modal"
        className="token-overlay absolute inset-0 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className={`relative z-10 max-h-[88vh] w-full overflow-hidden ${widthClassName}`}>
        <button
          type="button"
          onClick={onClose}
          className="ui-surface-1 ui-interactive absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-text/60 transition-colors hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="ui-modal-surface token-modal max-h-[88vh] overflow-y-auto rounded-[24px] p-2">
          {children}
        </div>
      </div>
    </div>
  );
}
