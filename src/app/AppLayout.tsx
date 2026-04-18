import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AnimatedBackground from "./components/AnimatedBackground";
import { InterfaceModeContext, type InterfaceMode } from "./hooks/useInterfaceMode";
import { LanguageProvider } from "./i18n/LanguageProvider";

export default function AppLayout() {
  const [mode, setMode] = useState<InterfaceMode>("pro");
  const toggle = useCallback(
    () => setMode((m) => (m === "pro" ? "lite" : "pro")),
    [],
  );
  const ctx = useMemo(() => ({ mode, setMode, toggle }), [mode, toggle]);

  return (
    <LanguageProvider>
      <InterfaceModeContext.Provider value={ctx}>
        <AnimatedBackground />
        <div className="relative flex min-h-screen bg-white/70 font-codec text-text">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </InterfaceModeContext.Provider>
    </LanguageProvider>
  );
}
