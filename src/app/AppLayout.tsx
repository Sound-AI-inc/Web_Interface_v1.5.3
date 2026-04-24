import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
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

  return (
    <LanguageProvider>
      <InterfaceModeContext.Provider value={ctx}>
        <AnimatedBackground />
        <div
          className={`relative flex min-h-screen bg-transparent font-codec text-text ${
            mode === "pro" ? "theme-pro" : "theme-lite"
          }`}
        >
          <Sidebar
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenUpgrade={() => setUpgradeModalOpen(true)}
          />
          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>
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
        className="absolute inset-0 bg-[rgba(18,18,18,0.28)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className={`relative z-10 max-h-[88vh] w-full overflow-hidden ${widthClassName}`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-surface bg-white/95 text-text/60 shadow-flat-sm transition-colors hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[88vh] overflow-y-auto rounded-[24px] border border-white/70 bg-[rgba(255,255,255,0.92)] p-2 shadow-[0_24px_80px_rgba(29,29,29,0.18)] backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}
