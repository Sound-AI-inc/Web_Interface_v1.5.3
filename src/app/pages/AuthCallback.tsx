import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Supabase is not configured");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const errorDescription = params.get("error_description");
    const mode = params.get("mode");

    if (errorParam) {
      setStatus("error");
      setError(errorDescription || errorParam);
      return;
    }

    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

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

        if (mode === "signup" || isNewUser(session.user)) {
          markNeedsOnboarding(session.user.id);
        }

        setStatus("ready");
        navigate("/onboarding", { replace: true });
      } catch (err) {
        console.error("[auth] callback error:", err);
        if (mounted) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      }
    };

    const handleCallback = async () => {
      try {
        console.info("[auth-debug] AuthCallback mounted", {
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
          mode,
        });

        const { data, error } = await supabase.auth.getSession();

        console.info("[auth-debug] getSession result", {
          hasError: Boolean(error),
          hasSession: Boolean(data.session),
          userId: data.session?.user?.id,
        });

        if (data.session) {
          await handleAuthReady(data.session);
          return;
        }

        const authResult = supabase.auth.onAuthStateChange(
          (event, nextSession) => {
            console.info("[auth-debug] onAuthStateChange in callback", {
              event,
              hasSession: Boolean(nextSession),
              userId: nextSession?.user?.id,
            });

            if (event === "SIGNED_IN" && nextSession) {
              subscription?.unsubscribe();
              void handleAuthReady(nextSession);
            }
          },
        );

        subscription = authResult.data.subscription;

        setTimeout(() => {
          if (mounted && status === "loading") {
            subscription?.unsubscribe();
            setStatus("error");
            setError("Authentication timeout. Please try again.");
          }
        }, 10000);
      } catch (err) {
        console.error("[auth] callback error:", err);
        if (mounted) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      }
    };

    void handleCallback();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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
