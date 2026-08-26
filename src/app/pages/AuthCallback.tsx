import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";
import { useAuth } from "../hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { markFreshSession } = useAuth();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);

  console.info("[auth-debug] AuthCallback RENDER", {
    url: window.location.href,
    search: window.location.search,
    isIframe: window.self !== window.top,
  });

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
      isIframe: window.self !== window.top,
      hasAccessToken: !!params.get("access_token"),
      hasRefreshToken: !!params.get("refresh_token"),
      hasCode: !!params.get("code"),
      hasError: !!params.get("error"),
    });

    const codeVerifierKey = Object.keys(window.localStorage).find(k => k.endsWith("-code-verifier"));
    console.info("[auth-debug] code_verifier check", {
      hasCodeVerifier: !!codeVerifierKey,
      codeVerifierKey,
      allLocalStorageKeys: Object.keys(window.localStorage),
      allSessionStorageKeys: Object.keys(window.sessionStorage),
    });

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.info("[auth-debug] onAuthStateChange listener", {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id,
      });
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session && mounted) {
        console.info("[auth-debug] SIGNED_IN received via listener", {
          userId: session.user?.id,
          mode,
        });
        void handleAuthReady(session);
      }
    });;

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

    const handleDuplicateAccount = (session: any) => {
      if (!mounted) return;

      console.warn("[auth-debug] Duplicate account detected in signup mode", {
        userId: session.user?.id,
        email: session.user?.email,
        mode,
        createdAt: session.user?.created_at,
        lastSignInAt: session.user?.last_sign_in_at,
      });

      setStatus("error");
      setError("���� ������� ��� ���������������. ��������� �� �������� �����.");
      setHints([
        "�� �������� ������������������, �� ������� � ����� email ��� ����������.",
        "��������� �� �������� ����� ��� ������������ ������.",
      ]);
    };

    const waitForSession = async () => {
      const authCode = params.get("code")
      if (authCode) {
        try {
          console.info("[auth-debug] PKCE exchange attempt", { authCode, mode })
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)
          if (exchangeError) {
            console.warn("[auth-debug] exchange error", exchangeError.message)
          } else if (data?.session) {
            console.info("[auth-debug] exchange success", { userId: data.session.user?.id, email: data.session.user?.email })
            if (mode === "signup" && !isNewUser(data.session.user)) {
              handleDuplicateAccount(data.session)
              return
            }
            await handleAuthReady(data.session)
            return
          }
        } catch (err) {
          console.warn("[auth-debug] exchange exception", err)
        }
      }


      for (let i = 0; i < 40; i++) {
        if (!mounted) return;

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const session = data.session;

          if (mode === "signup" && !isNewUser(session.user)) {
            handleDuplicateAccount(session);
            return;
          }

          await handleAuthReady(session);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          console.info("[auth-debug] getUser fallback found user after getSession returned null", {
            userId: userData.user.id,
            email: userData.user.email,
            mode,
          });

          if (mode === "signup" && !isNewUser(userData.user)) {
            handleDuplicateAccount(userData.user);
            return;
          }

          await handleAuthReady({ ...userData, user: userData.user });
          return;
        }

        console.debug("[auth-debug] waiting for session", {
          attempt: i + 1,
          hasAccessToken: !!params.get("access_token"),
          hasRefreshToken: !!params.get("refresh_token"),
          hasCode: !!params.get("code"),
        });

        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 500);
        });
      }

      if (mounted) {
        console.error("[auth-debug] Authentication timeout after 40 attempts", {
          url: window.location.href,
          search: window.location.search,
          isIframe: window.self !== window.top,
          hasAccessToken: !!params.get("access_token"),
          hasRefreshToken: !!params.get("refresh_token"),
          hasCode: !!params.get("code"),
        });

        const timeoutHints: string[] = [
          "��������� URL � �������� ������: ������ ���� ��������� access_token ��� code.",
          "���� ���������� ������� �� ���������� ���� (iframe), ������-party cookies ����� �������������.",
          "��������� ��������� Redirect URLs � ������ Supabase (Authentication > URL Configuration).",
          "���������, ��� � Supabase �������� ���������� Google � Spotify.",
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
       authListener.unsubscribe();
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
        <div className="font-codec text-sm text-[var(--text-secondary)]">Completing authentication�</div>
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
              <p className="mb-2 font-semibold text-[var(--text-primary)]">��������� ��� �������:</p>
              <ul className="list-inside list-disc space-y-1">
                {hints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/sign-in", { replace: true })}
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
