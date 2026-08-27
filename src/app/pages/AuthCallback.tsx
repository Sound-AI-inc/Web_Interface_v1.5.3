import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type OAuthMode = "signin" | "signup";

function readOAuthMode(url: URL): OAuthMode {
  const mode = url.searchParams.get("mode") ?? sessionStorage.getItem("soundai:oauth-mode");
  sessionStorage.removeItem("soundai:oauth-mode");
  return mode === "signup" ? "signup" : "signin";
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { markFreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const completeOAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error("Authentication is not configured.");
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const oauthError = url.searchParams.get("error");
      const oauthErrorDescription = url.searchParams.get("error_description");
      const mode = readOAuthMode(url);

      if (oauthError) {
        throw new Error(oauthErrorDescription || oauthError);
      }

      if (!code) {
        throw new Error("Missing OAuth authorization code.");
      }

      console.info("[auth-debug] Exchanging OAuth code for session");

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("[auth-debug] OAuth exchange failed", exchangeError);
        throw exchangeError;
      }

      const session = data.session;
      if (!session?.user) {
        throw new Error("OAuth completed but no user session was created.");
      }

      const user = session.user;

      console.info("[auth-debug] OAuth session created", {
        userId: user.id,
        mode,
      });

      window.history.replaceState({}, document.title, "/auth/callback");

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id" });

      if (profileError) {
        throw profileError;
      }

      markFreshSession();

      if (mode === "signup") {
        await ensureSignupCredits(user.id);
        markNeedsOnboarding(user.id);
        navigate("/onboarding?fresh=1&signup=1", { replace: true });
        return;
      }

      navigate("/create?fresh=1", { replace: true });
    };

    void completeOAuth().catch((err) => {
      console.error("[auth-debug] OAuth callback failed", err);
      setError(err instanceof Error ? err.message : "Authentication failed.");
    });
  }, [navigate, markFreshSession]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)] px-6">
        <div className="w-full max-w-md">
          <div className="rounded-input border border-[var(--error)]/30 bg-[var(--surface-secondary)] p-4 text-sm text-[var(--error)]">
            {error}
          </div>

          <button
            type="button"
            onClick={() => navigate("/sign-in", { replace: true })}
            className="app-btn-primary mt-4 w-full"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
      <div className="font-codec text-sm text-[var(--text-secondary)]">
        Completing authentication...
      </div>
    </div>
  );
}
