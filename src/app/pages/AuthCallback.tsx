import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../app/lib/supabase";
import { ensureSignupCredits } from "../app/lib/creditsService";
import { markNeedsOnboarding } from "../app/lib/onboardingService";

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

    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          setStatus("error");
          setError("No session found after authentication");
          return;
        }

        const user = data.session.user;

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: user.id }, { onConflict: "id" });

        if (profileError) {
          console.warn("[auth] profile upsert failed:", profileError.message);
        }

        await ensureSignupCredits(user.id);

        if (mode === "signup" || isNewUser(user)) {
          markNeedsOnboarding(user.id);
        }

        setStatus("ready");
        navigate("/onboarding", { replace: true });
      } catch (err) {
        console.error("[auth] callback error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    void handleCallback();
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
