import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSupabase } from "../lib/supabase";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";
import { useAuth } from "../hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { markFreshSession } = useAuth();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Supabase is not configured");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");
    const urlMode = params.get("mode");
    const storedMode = sessionStorage.getItem("soundai:oauth-mode");
    const mode = urlMode || storedMode || "signin";

    if (storedMode) {
      sessionStorage.removeItem("soundai:oauth-mode");
    }

    if (errorParam) {
      setStatus("error");
      setError(errorDescription || errorParam);
      return;
    }

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleAuthReady = async (session: any) => {
      if (!mounted) return;

      try {
        console.info("[auth-debug] AuthCallback session ready", {
          userId: session.user?.id,
          mode,
        });

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: session.user.id }, { onConflict: "id" });

        console.info("[auth-debug] profile upsert result", {
          userId: session.user.id,
          error: profileError?.message ?? null,
        });

        if (profileError) {
          console.warn("[auth] profile upsert failed:", profileError.message);
        }

        await ensureSignupCredits(session.user.id);

        const isSignUp = mode === "signup" || isNewUser(session.user);

        if (isSignUp) {
          markNeedsOnboarding(session.user.id);
        }

        setStatus("ready");

        if (isSignUp) {
          navigate("/onboarding?fresh=1&signup=1", { replace: true });
        } else {
          markFreshSession();
          navigate("/create?fresh=1", { replace: true });
        }
      } catch (err) {
        console.error("[auth] callback error:", err);
        if (mounted) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      }
    };

    const waitForSession = async () => {
      for (let i = 0; i < 40; i++) {
        if (!mounted) return;

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await handleAuthReady(data.session);
          return;
        }

        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 500);
        });
      }

      if (mounted) {
        setStatus("error");
        setError("Authentication timeout. Please try again.");
      }
    };

    void waitForSession();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  function isNewUser(user: { created_at?: string; last_sign_in_at?: string }): boolean {
    const created = user.created_at ? new Date(user.created_at).getTime() : 0;
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
    if (!created || !lastSignIn) return true;
    return lastSignIn - created < 5_000;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="font-codec text-sm text-[var(--text-secondary)]">Completing authentication…</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="w-full max-w-md px-6">
          <div className="rounded-input border border-[var(--error)]/30 bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--error)]">
            {error || "Authentication failed"}
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

  return null;
}
