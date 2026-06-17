import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, Navigate, useLocation, useSearchParams } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import AnimatedBackground from "./components/AnimatedBackground";
import SettingsContent from "./components/SettingsContent";
import UpgradePlanModalContent from "./components/UpgradePlanModalContent";
import ShellModal from "./components/ShellModal";
import { InterfaceModeContext, type InterfaceMode } from "./hooks/useInterfaceMode";
import { useAuth } from "./hooks/useAuth";
import { useWorkspaceStore } from "./state/workspaceStore";
import { LanguageProvider } from "./i18n/LanguageProvider";
import {
  fetchOnboardingStatus,
  isOnboardingCompleteSync,
  shouldRequireOnboarding,
} from "./lib/onboardingService";

const MODE_STORAGE_KEY = "soundai:interface-mode";

function readStoredMode(): InterfaceMode {
  if (typeof window === "undefined") return "lite";
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  return stored === "pro" || stored === "lite" ? stored : "lite";
}

export default function AppLayout() {
  const [mode, setModeState] = useState<InterfaceMode>(readStoredMode);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { session, loading, configured, consumeFreshSession, markFreshSession } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const startNewSession = useWorkspaceStore((s) => s.startNewSession);
  const isWorkspaceRoute = location.pathname.includes("/generator");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const setMode = useCallback((next: InterfaceMode) => {
    setModeState(next);
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "pro" ? "lite" : "pro"),
    [mode, setMode],
  );

  const ctx = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  useEffect(() => {
    if (searchParams.get("fresh") === "1") {
      markFreshSession();
      window.history.replaceState({}, "", location.pathname);
    }
  }, [searchParams, markFreshSession, location.pathname]);

  useEffect(() => {
    const applyFreshSession = () => {
      if (consumeFreshSession()) {
        startNewSession();
        setMode("lite");
      }
    };

    if (useWorkspaceStore.persist.hasHydrated()) {
      applyFreshSession();
    }

    return useWorkspaceStore.persist.onFinishHydration(applyFreshSession);
  }, [consumeFreshSession, startNewSession, setMode]);

  useEffect(() => {
    if (!session?.user?.id) {
      setOnboardingComplete(true);
      return;
    }

    const userId = session.user.id;
    const createdAt = session.user.created_at;

    if (isOnboardingCompleteSync(userId)) {
      setOnboardingComplete(true);
      return;
    }

    if (!shouldRequireOnboarding(userId, createdAt)) {
      setOnboardingComplete(true);
      return;
    }

    void fetchOnboardingStatus(userId).then((record) => {
      setOnboardingComplete(Boolean(record?.completedAt));
    });
  }, [session?.user?.id, session?.user?.created_at]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pro", "theme-lite");
    root.classList.add(mode === "pro" ? "theme-pro" : "theme-lite");
    root.setAttribute("data-theme", mode === "pro" ? "pro" : "lite");
  }, [mode]);

  if (configured && !loading && !session) {
    return <Navigate to="/sign-in" replace />;
  }

  if (session?.user && onboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  if (session?.user && onboardingComplete === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="font-codec text-sm text-[var(--text-secondary)]">Loading workspace…</div>
      </div>
    );
  }

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
