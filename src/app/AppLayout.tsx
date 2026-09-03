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
  shouldShowGuidedTour,
} from "./lib/onboardingService";
import { fetchUserCredits, ensureSignupCredits } from "./lib/creditsService";
import GuidedTourModal from "./components/GuidedTourModal";

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
  const [showGuidedTour, setShowGuidedTour] = useState(false);

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
      console.info("[auth-debug] AppLayout redirect to /sign-in because no session");
      setOnboardingComplete(true);
      setShowGuidedTour(false);
      return;
    }

    const userId = session.user.id;
    const createdAt = session.user.created_at;

    if (isOnboardingCompleteSync(userId)) {
      console.info("[auth-debug] AppLayout allow workspace, onboarding complete sync", { userId });
      setOnboardingComplete(true);
      setShowGuidedTour(shouldShowGuidedTour(userId));
      return;
    }

    if (!shouldRequireOnboarding(userId, createdAt)) {
      console.info("[auth-debug] AppLayout allow workspace, no onboarding required", { userId, createdAt });
      setOnboardingComplete(true);
      setShowGuidedTour(shouldShowGuidedTour(userId));
      return;
    }

    console.info("[auth-debug] AppLayout will fetch onboarding status", { userId, createdAt });
    void fetchOnboardingStatus(userId).then((record) => {
      const completed = Boolean(record?.completedAt);
      setOnboardingComplete(completed);
      setShowGuidedTour(completed && shouldShowGuidedTour(userId));
    });
  }, [session?.user?.id, session?.user?.created_at]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pro", "theme-lite");
    root.classList.add(mode === "pro" ? "theme-pro" : "theme-lite");
    root.setAttribute("data-theme", mode === "pro" ? "pro" : "lite");
  }, [mode]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const userEmail = session.user.email;

    void fetchUserCredits(userId).then((credits) => {
      console.info("[app-init] Credits loaded", { balance: credits?.balance });
    }).catch((err) => {
      console.warn("[credits] Background fetch failed:", err);
    });

    void ensureSignupCredits(userId, userEmail).catch((err) => {
      console.warn("[credits] Background init failed:", err);
    });
  }, [session?.user?.id, session?.user?.email]);

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
          <GuidedTourModal
            open={showGuidedTour}
            userId={session?.user?.id}
            onClose={() => setShowGuidedTour(false)}
          />
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
