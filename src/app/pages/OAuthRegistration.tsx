import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "../lib/supabase";
import { ensureSignupCredits } from "../lib/creditsService";
import { markNeedsOnboarding } from "../lib/onboardingService";
import { useAuth } from "../hooks/useAuth";

const WEBSITE_URL =
  (import.meta.env.VITE_WEBSITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:4174";

const oauthProviders: Array<{ label: string; provider: Provider }> = [
  { label: "Google", provider: "google" },
  { label: "Spotify", provider: "spotify" },
];

export default function OAuthRegistration() {
  const location = useLocation();
  const navigate = useNavigate();
  const { markFreshSession } = useAuth();
  const isSignUp = location.pathname === "/sign-up" || location.pathname === "/auth";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copy = useMemo(
    () =>
      isSignUp
        ? {
            title: "Sign up",
            cta: "Create account",
            switchText: "Already have an account?",
            switchPath: "/sign-in",
            switchLabel: "Sign in",
          }
        : {
            title: "Sign in",
            cta: "Sign in",
            switchText: "Need an account?",
            switchPath: "/sign-up",
            switchLabel: "Sign up",
          },
    [isSignUp],
  );

  const redirectAfterSignUp = (userId?: string) => {
    if (userId) markNeedsOnboarding(userId);
    markFreshSession();
    navigate("/onboarding?signup=1", { replace: true });
  };

  const redirectAfterSignIn = () => {
    markFreshSession();
    navigate("/create?fresh=1", { replace: true });
  };

  const startOAuth = async (provider: Provider) => {
    setError(null);
    setNotice(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth is not configured. Please try again later.");
      return;
    }

    const mode = isSignUp ? "signup" : "signin";
    sessionStorage.setItem("soundai:oauth-mode", mode);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?mode=${mode}`,
        queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError("Auth is not configured yet. Please set Supabase variables and try again.");
        return;
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/onboarding?signup=1&fresh=1`,
          },
        });
        if (signUpError) throw signUpError;
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          await ensureSignupCredits(sessionData.session.user.id);
          redirectAfterSignUp(sessionData.session.user.id);
        } else {
          redirectAfterSignUp();
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      redirectAfterSignIn();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const recoverPassword = async () => {
    setError(null);
    setNotice(null);

    if (!email) {
      setError("Enter your email first, then request a password reset.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setNotice("Demo auth is active. Password recovery requires Supabase configuration.");
      return;
    }

    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/sign-in`,
      });
      if (resetError) throw resetError;
      setNotice("Password reset email sent.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not send password reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      data-theme="pro"
      className="theme-pro min-h-screen bg-[var(--background-primary)] font-codec text-[var(--text-primary)]"
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1200px] gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <section className="auth-brand-panel relative flex min-h-[420px] flex-col justify-center p-10 lg:min-h-[560px]">
          <div className="relative z-[1]">
            <Link
              to={`${WEBSITE_URL}/`}
              className="mb-10 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
            <div className="font-syne text-[42px] font-bold tracking-[-0.03em]">SoundAI</div>
            <p className="mt-6 max-w-md font-codec text-[22px] font-medium leading-snug text-[var(--text-primary)]">
              Create production-ready
            </p>
            <ul className="mt-4 space-y-2 font-codec text-[18px] text-[var(--text-secondary)]">
              <li>Audio Samples</li>
              <li>MIDI</li>
              <li>VST Presets</li>
            </ul>
            <p className="mt-6 font-codec text-[15px] leading-7 text-[var(--text-secondary)]">
              for any DAW
            </p>
            <p className="mt-8 max-w-sm font-codec text-sm leading-7 text-[var(--text-muted)]">
              Built for producers, composers, sound designers, and studios.
            </p>
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="auth-card w-full max-w-[560px] p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="font-syne text-[28px] font-bold">{copy.title}</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {copy.switchText}{" "}
                <Link to={copy.switchPath} className="font-semibold text-primary hover:opacity-80">
                  {copy.switchLabel}
                </Link>
              </p>
              {!supabaseConfigured() && (
                <span className="mt-3 inline-flex rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1 text-[11px] font-semibold text-primary">
                  Demo auth
                </span>
              )}
            </div>

            <div className="grid gap-3">
              {oauthProviders.map((provider) => (
                <button
                  key={provider.provider}
                  type="button"
                  onClick={() => void startOAuth(provider.provider)}
                  className="app-btn-ghost min-h-[48px] justify-center"
                >
                  Continue with {provider.label}
                </button>
              ))}
            </div>

            <div className="my-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-primary)]" />
              <span className="text-xs text-[var(--text-muted)]">or email</span>
              <div className="h-px flex-1 bg-[var(--border-primary)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="app-input"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="app-input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? "Create password" : "Password"}
                    className="app-input pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-input border border-[var(--error)]/30 bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--error)]">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded-input border border-primary/30 bg-[var(--surface-secondary)] px-4 py-3 text-sm text-primary">
                  {notice}
                </div>
              )}

              <button type="submit" disabled={busy} className="app-btn-primary w-full py-3">
                {busy ? "Please wait…" : copy.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => void recoverPassword()}
                  disabled={busy}
                  className="w-full text-center text-sm font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              )}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

