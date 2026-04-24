import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";

const AppLayout = lazy(() => import("./app/AppLayout"));
const AudioGenerator = lazy(() => import("./app/pages/AudioGenerator"));
const Prompts = lazy(() => import("./app/pages/Prompts"));
const Arrangement = lazy(() => import("./app/pages/Arrangement"));
const EditorMode = lazy(() => import("./app/pages/EditorMode"));
const Library = lazy(() => import("./app/pages/Library"));
const Export = lazy(() => import("./app/pages/Export"));
const Integrations = lazy(() => import("./app/pages/Integrations"));
const Billing = lazy(() => import("./app/pages/Billing"));
const Profile = lazy(() => import("./app/pages/Profile"));
const Settings = lazy(() => import("./app/pages/Settings"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eff3f6] px-6">
      <div className="rounded-card border border-primary/20 bg-white px-6 py-4 font-poppins text-sm font-medium text-text shadow-flat-sm">
        Loading SoundAI...
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/app/generator" replace />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/generator" replace />} />
            <Route path="generator" element={<AudioGenerator />} />
            <Route path="prompts" element={<Prompts />} />
            <Route path="arrangement" element={<Arrangement />} />
            <Route path="editor" element={<EditorMode />} />
            <Route path="library" element={<Library />} />
            <Route path="export" element={<Export />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/app/generator" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
