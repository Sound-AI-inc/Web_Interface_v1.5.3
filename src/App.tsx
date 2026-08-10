import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./app/hooks/useAuth";
import { LanguageProvider } from "./app/i18n/LanguageProvider";

const AppLayout = lazy(() => import("./app/AppLayout"));
const AudioGenerator = lazy(() => import("./app/pages/AudioGenerator"));
const ProjectWorkspace = lazy(() => import("./app/pages/ProjectWorkspace"));
const Prompts = lazy(() => import("./app/pages/Prompts"));
const Arrangement = lazy(() => import("./app/pages/Arrangement"));
const EditorMode = lazy(() => import("./app/pages/EditorMode"));
const Library = lazy(() => import("./app/pages/Library"));
const Export = lazy(() => import("./app/pages/Export"));
const Integrations = lazy(() => import("./app/pages/Integrations"));
const Billing = lazy(() => import("./app/pages/Billing"));
const Profile = lazy(() => import("./app/pages/Profile"));
const Settings = lazy(() => import("./app/pages/Settings"));
const Notifications = lazy(() => import("./app/pages/Notifications"));
const HelpPage = lazy(() => import("./app/pages/help/HelpPage"));
const OAuthRegistration = lazy(() => import("./app/pages/OAuthRegistration"));
const OnboardingSurvey = lazy(() => import("./app/pages/OnboardingSurvey"));
const AuthCallback = lazy(() => import("./app/pages/AuthCallback"));

function RouteFallback() {
  return (
    <div className="theme-pro flex min-h-screen items-center justify-center bg-[var(--background-primary)] px-6">
      <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-primary)] px-6 py-4 font-poppins text-sm font-medium text-[var(--text-primary)] shadow-flat-sm">
        Loading SoundAI...
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/sign-up" replace />} />
            <Route path="/auth" element={<OAuthRegistration />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/sign-in" element={<OAuthRegistration />} />
            <Route path="/sign-up" element={<OAuthRegistration />} />
            <Route path="/welcome" element={<Navigate to="/sign-up" replace />} />

            <Route
              path="/onboarding"
              element={
                <LanguageProvider>
                  <OnboardingSurvey />
                </LanguageProvider>
              }
            />

            <Route path="/create" element={<AudioGenerator />} />

            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/generator" replace />} />
              <Route path="generator" element={<AudioGenerator />} />
              <Route path="projects/:projectId" element={<ProjectWorkspace />} />
              <Route path="prompts" element={<Prompts />} />
              <Route path="arrangement" element={<Arrangement />} />
              <Route path="editor" element={<EditorMode />} />
              <Route path="library" element={<Library />} />
              <Route path="export" element={<Export />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="billing" element={<Billing />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            <Route
              path="/help/:slug"
              element={
                <LanguageProvider>
                  <HelpPage />
                </LanguageProvider>
              }
            />

            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
