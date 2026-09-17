import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./app/hooks/useAuth";
import { LanguageProvider } from "./app/i18n/LanguageProvider";
import RequirePro from "./app/components/RequirePro";

const AppLayout = lazy(() => import("./app/AppLayout"));
const AudioGenerator = lazy(() => import("./app/pages/AudioGenerator"));
const ProjectWorkspace = lazy(() => import("./app/pages/ProjectWorkspace"));
const Prompts = lazy(() => import("./app/pages/Prompts"));
const Arrangement = lazy(() => import("./app/pages/Arrangement"));
const EditorMode = lazy(() => import("./app/pages/EditorMode"));
const Library = lazy(() => import("./app/pages/Library"));
const Export = lazy(() => import("./app/pages/Export"));
const Billing = lazy(() => import("./app/pages/Billing"));
const Profile = lazy(() => import("./app/pages/Profile"));
const Settings = lazy(() => import("./app/pages/Settings"));
const Notifications = lazy(() => import("./app/pages/Notifications"));
const Archive = lazy(() => import("./app/pages/Archive"));
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

function RootRedirect() {
  const { session, loading, configured } = useAuth();

  const oauthMode = typeof window !== "undefined" ? sessionStorage.getItem("soundai:oauth-mode") : null;
  const hasOAuthIntent = Boolean(oauthMode);

  console.info("[auth-debug] route guard", {
    pathname: window.location.pathname,
    loading,
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    hasOAuthIntent,
    oauthMode,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="font-codec text-sm text-[var(--text-secondary)]">Loading SoundAI...</div>
      </div>
    );
  }

  if (hasOAuthIntent && !session) {
    console.info("[auth-debug] OAuth landing detected, waiting for session", {
      mode: oauthMode,
    });
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="font-codec text-sm text-[var(--text-secondary)]">Completing authentication…</div>
      </div>
    );
  }

  if (configured && session) {
    console.info("[auth-debug] redirect", {
      from: "/",
      to: "/app/generator",
      reason: "authenticated",
    });
    return <Navigate to="/app/generator" replace />;
  }

  // UX-025: production without Supabase configuration fails closed to
  // sign-in; only development keeps the demo-auth path.
  if (!configured && import.meta.env.PROD) {
    return <Navigate to="/sign-in" replace />;
  }

  console.info("[auth-debug] redirect", {
    from: "/",
    to: "/sign-up",
    reason: "unauthenticated",
  });
  return <Navigate to="/sign-up" replace />;
}

/**
 * UX-011: legacy entry point. Forwards to the canonical generator,
 * preserving query parameters (e.g. ?fresh=1). Replace (no history spam,
 * sane back/forward, no redirect loop — distinct path).
 */
function CreateRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/app/generator${search}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
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

            <Route path="/create" element={<CreateRedirect />} />

            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/generator" replace />} />
              <Route path="generator" element={<AudioGenerator />} />
              <Route path="projects/:projectId" element={<ProjectWorkspace />} />
              <Route path="prompts" element={<Prompts />} />
              <Route path="arrangement" element={<Arrangement />} />
              <Route
                path="editor"
                element={
                  <RequirePro
                    title="Editor Mode"
                    subtitle="Lightweight editing layer for generated assets."
                    feature="Editor Mode unlocks audio trimming, MIDI piano roll, and synth preset editing."
                  >
                    <EditorMode />
                  </RequirePro>
                }
              />
              <Route
                path="library"
                element={
                  <RequirePro
                    title="Library"
                    subtitle="Your generated audio, MIDI, and preset assets."
                    feature="Library organizes your generated audio, MIDI, and preset assets across folders."
                  >
                    <Library />
                  </RequirePro>
                }
              />
              <Route
                path="export"
                element={
                  <RequirePro
                    title="Export"
                    subtitle="Send library assets to your DAW or disk."
                    feature="Export sends your library assets to your local DAW or disk."
                  >
                    <Export />
                  </RequirePro>
                }
              />
              <Route path="billing" element={<Billing />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="archive" element={<Archive />} />
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
