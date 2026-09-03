import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";

const CALLBACK_ROUTE = "/auth/callback";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);

  console.info("[auth-debug] AuthCallback RENDER", {
    url: window.location.href,
    search: window.location.search,
    hash: window.location.hash,
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("error");
      setError("Supabase is not configured");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const errorParam = params.get("error") || hashParams.get("error");
    const errorDescription = params.get("error_description") || hashParams.get("error_description");
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

    console.info("[auth-debug] AuthCallback mounted", {
      mode,
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
    });

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleAuthReady = async (session: any) => {
      if (!mounted) return;

      try {
        console.info("[auth-debug] AuthCallback session ready", {
          userId: session.user?.id,
          email: session.user?.email,
          mode,
          isNewUser: isNewUser(session.user),
          createdAt: session.user?.created_at,
          lastSignInAt: session.user?.last_sign_in_at,
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

        const isSignUp = mode === "signup" || isNewUser(session.user);

        if (isSignUp) {
          markNeedsOnboarding(session.user.id);
          void ensureSignupCredits(session.user.id, session.user.email);
        } else {
          void ensureSignupCredits(session.user.id, session.user.email);
        }

        setStatus("ready");

        let destination: string;
        if (isSignUp) {
          destination = `/onboarding?fresh=1&signup=1`;
        } else {
          destination = `/app/generator?fresh=1`;
        }

        console.info("[auth-debug] callback:redirect", {
          destination,
          isSignUp,
          mode,
        });

        window.location.replace(destination);
      } catch (err) {
        console.error("[auth] callback error:", err);
        if (mounted) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      }
    };

    const handleUnregisteredSignIn = (session: any) => {
      if (!mounted) return;
      console.warn("[auth-debug] Unregistered user tried to sign in", {
        userId: session.user?.id,
        email: session.user?.email,
        mode,
      });
      setStatus("error");
      setError("You haven't registered yet. Please complete registration first.");
      setHints([
        "You tried to sign in with an account that has not been registered with SoundAI.",
        "Please go to registration and create an account first.",
      ]);
      void supabase.auth.signOut();
    };

    const waitForSession = async () => {
      const authCode = params.get("code") || hashParams.get("code");
      if (authCode) {
        try {
          console.info("[auth-debug] callback:exchange:start", { mode });
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            console.warn("[auth-debug] callback:exchange:error", exchangeError.message);
          } else if (data?.session) {
            console.info("[auth-debug] callback:exchange:success", {
              userId: data.session.user?.id,
              email: data.session.user?.email,
            });

            if (mode === "signin" && isNewUser(data.session.user)) {
              handleUnregisteredSignIn(data.session);
              return;
            }

            await handleAuthReady(data.session);
            return;
          }
        } catch (err) {
          console.warn("[auth-debug] callback:exchange:exception", err);
        }
      }

      for (let i = 0; i < 40; i++) {
        if (!mounted) return;

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const session = data.session;

          if (mode === "signin" && isNewUser(session.user)) {
            handleUnregisteredSignIn(session);
            return;
          }

          console.info("[auth-debug] callback:session-found", {
            attempt: i + 1,
            userId: session.user?.id,
          });
          await handleAuthReady(session);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          console.info("[auth-debug] callback:getUser-fallback", {
            userId: userData.user.id,
            email: userData.user.email,
            mode,
          });

          if (mode === "signin" && isNewUser(userData.user)) {
            handleUnregisteredSignIn({ ...userData, user: userData.user });
            return;
          }

          await handleAuthReady({ ...userData, user: userData.user });
          return;
        }

        console.debug("[auth-debug] callback:waiting", {
          attempt: i + 1,
        });

        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 250);
        });
      }

      if (mounted) {
        console.error("[auth-debug] callback:timeout", {
          url: window.location.href,
          search: window.location.search,
        });

        const timeoutHints: string[] = [
          "Check that the callback URL includes an access_token or code.",
          "Make sure third-party cookies are not blocked (iframe, browser settings).",
          "Verify Redirect URLs are configured in Supabase Authentication settings.",
          "Ensure Google and Spotify providers are enabled in Supabase.",
        ];

        setHints(timeoutHints);
        setStatus("error");
        setError("Authentication timeout. Please try again.");
      }
    };

    void waitForSession();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

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
        <div className="w-full max-w-md px-6 space-y-4">
          <div className="rounded-input border border-[var(--error)]/30 bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--error)]">
            {error || "Authentication failed"}
          </div>
          {hints.length > 0 && (
            <div className="rounded-input border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="mb-2 font-semibold text-[var(--text-primary)]">Suggestions:</p>
              <ul className="list-inside list-disc space-y-1">
                {hints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => (window.location.href = "/sign-in")}
            className="app-btn-primary w-full"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export { CALLBACK_ROUTE };
