import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import AnimatedBackground from "../components/AnimatedBackground";
import Sidebar from "../components/Sidebar";
import ShellModal from "../components/ShellModal";
import SettingsContent from "../components/SettingsContent";
import UpgradePlanModalContent from "../components/UpgradePlanModalContent";
import InteractiveProductTour, { hasSeenProductTour } from "../components/InteractiveProductTour";
import { InterfaceModeContext, type InterfaceMode } from "../hooks/useInterfaceMode";
import { useAuth } from "../hooks/useAuth";
import { useWorkspaceStore } from "../state/workspaceStore";
import { isOnboardingCompleteSync, shouldRequireOnboarding, fetchOnboardingStatus } from "../lib/onboardingService";
import { fetchUserCredits, ensureSignupCredits, checkMonthlyRefresh } from "../lib/creditsService";

const MODE_STORAGE_KEY = "soundai:interface-mode";
const TOUR_DELAY_MS = 800;

function readStoredMode(): InterfaceMode {
  if (typeof window === "undefined") return "lite";
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  return stored === "pro" || stored === "lite" ? stored : "lite";
}

export default function CreateWorkspace({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<InterfaceMode>(readStoredMode);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { session, consumeFreshSession, markFreshSession } = useAuth();
  const startNewSession = useWorkspaceStore((s) => s.startNewSession);

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
    if (consumeFreshSession()) {
      startNewSession();
      setMode("lite");
    }
  }, [consumeFreshSession, startNewSession, setMode]);

  useEffect(() => {
    if (!session) {
      markFreshSession();
    }
  }, [session, markFreshSession]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-pro", "theme-lite");
    root.classList.add(mode === "pro" ? "theme-pro" : "theme-lite");
    root.setAttribute("data-theme", mode === "pro" ? "pro" : "lite");
  }, [mode]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const createdAt = session.user.created_at;
    const isFirstRun = !hasSeenProductTour();
    const needsOnboarding = shouldRequireOnboarding(userId, createdAt);

    if (isFirstRun && !needsOnboarding) {
      const timer = setTimeout(() => {
        setShowTour(true);
        console.info("[onboarding] Product tour started");
      }, TOUR_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (needsOnboarding && !isOnboardingCompleteSync(userId)) {
      void fetchOnboardingStatus(userId).then(() => {
        console.info("[app-init] Onboarding state loaded");
      });
    }
  }, [session?.user?.id, session?.user?.created_at]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const userEmail = session.user.email;

    void fetchUserCredits(userId).then((credits) => {
      console.info("[app-init] Credits loaded", { balance: credits?.balance, plan: credits?.plan });
      if (credits) {
        void checkMonthlyRefresh(userId, credits.plan, credits.balance, credits.resetAt).then((refreshed) => {
          if (refreshed) {
            console.info("[credits] Monthly refresh applied", { balance: refreshed.balance });
          }
        });
      }
    }).catch((err) => {
      console.warn("[credits] Background fetch failed:", err);
    });

    void ensureSignupCredits(userId, userEmail).catch((err) => {
      console.warn("[credits] Background init failed:", err);
    });
  }, [session?.user?.id, session?.user?.email]);

  const handleTourClose = () => {
    setShowTour(false);
  };

  return (
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
          <main className="min-h-0 flex-1 overflow-hidden bg-[var(--background-primary)]">
            {children}
          </main>
        </div>
        <ShellModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} widthClassName="max-w-[1040px]">
          <SettingsContent onSave={() => setSettingsModalOpen(false)} compact />
        </ShellModal>
        <ShellModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} widthClassName="max-w-[1240px]">
          <UpgradePlanModalContent />
        </ShellModal>
        <InteractiveProductTour open={showTour} onClose={handleTourClose} />
      </div>
    </InterfaceModeContext.Provider>
  );
}
