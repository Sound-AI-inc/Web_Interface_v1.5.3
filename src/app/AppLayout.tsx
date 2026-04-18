import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { InterfaceModeContext, type InterfaceMode } from "./hooks/useInterfaceMode";

export default function AppLayout() {
  const [mode, setMode] = useState<InterfaceMode>("pro");
  const toggle = useCallback(
    () => setMode((m) => (m === "pro" ? "lite" : "pro")),
    [],
  );
  const ctx = useMemo(() => ({ mode, setMode, toggle }), [mode, toggle]);

  return (
    <InterfaceModeContext.Provider value={ctx}>
      <div className="flex min-h-screen bg-white font-codec text-text">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </InterfaceModeContext.Provider>
  );
}
