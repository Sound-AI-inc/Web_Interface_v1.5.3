import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, Music2, ShieldCheck, Sparkles } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "../lib/supabase";

const WEBSITE_URL =
  (import.meta.env.VITE_WEBSITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:4174";

const oauthProviders: Array<{ label: string; provider: Provider }> = [
  { label: "Continue with Google", provider: "google" },
  { label: "Continue with Spotify", provider: "spotify" },
  { label: "Continue with Apple", provider: "apple" },
];

export default function OAuthRegistration() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname === "/sign-up" || location.pathname === "/auth";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Producer");
  const [goal, setGoal] = useState("Generate audio ideas faster");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const copy = useMemo(
    () =>
      isSignUp
        ? {
            eyebrow: "SoundAI OAuth",
            title: "Create your SoundAI workspace",
            description: "Register once, activate your 8-day access period, then continue directly into the production interface.",
            cta: "Create workspace",
            switchText: "Already have an account?",
            switchPath: "/sign-in",
            switchLabel: "Sign in",
          }
        : {
            eyebrow: "Welcome back",
            title: "Sign in to SoundAI",
            description: "Access saved generations, prompt history, and your current SoundAI workspace.",
            cta: "Sign in",
            switchText: "Need an account?",
            switchPath: "/sign-up",
            switchLabel: "Sign up",
          },
    [isSignUp],
  );

  const redirectToApp = () => navigate("/app/generator", { replace: true });

  const startOAuth = async (provider: Provider) => {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      redirectToApp();
      return;
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app/generator`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (oauthError) setError(oauthError.message);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        redirectToApp();
        return;
      }

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role, goal },
            emailRedirectTo: `${window.location.origin}/app/generator`,
          },
        });
        if (signUpError) throw signUpError;
        redirectToApp();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      redirectToApp();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface font-codec text-text">
      <div className="mx-auto grid min-h-screen w-full max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="flex flex-col gap-8">
          <Link to={`${WEBSITE_URL}/`} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-text/60 transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-5 max-w-xl font-poppins text-[42px] font-semibold leading-[1.05] text-text sm:text-[54px]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-text/62">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="app-card p-5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="mt-3 font-poppins text-sm font-medium">Secure account handoff</div>
              <p className="mt-1 text-xs leading-5 text-text/58">Website traffic lands here before opening the app workspace.</p>
            </div>
            <div className="app-card p-5">
              <Music2 className="h-5 w-5 text-primary" />
              <div className="mt-3 font-poppins text-sm font-medium">Creator profile setup</div>
              <p className="mt-1 text-xs leading-5 text-text/58">Registration metadata is stored with auth profile data for onboarding defaults.</p>
            </div>
          </div>
        </section>

        <section className="app-card p-6 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-poppins text-[24px] font-semibold leading-tight">{copy.title}</h2>
              <p className="mt-2 text-sm text-text/58">
                {copy.switchText}{" "}
                <Link to={copy.switchPath} className="font-medium text-primary hover:text-primary/80">
                  {copy.switchLabel}
                </Link>
              </p>
            </div>
            {!supabaseConfigured() && (
              <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium text-primary">
                Demo auth
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {oauthProviders.map((provider) => (
              <button
                key={provider.provider}
                type="button"
                onClick={() => void startOAuth(provider.provider)}
                className="app-btn-ghost min-h-[44px] px-3 text-xs"
              >
                {provider.label.replace("Continue with ", "")}
              </button>
            ))}
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface" />
            <span className="text-xs text-text/42">or continue with email</span>
            <div className="h-px flex-1 bg-surface" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text/72">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text/34" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="app-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text/72">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text/34" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  className="app-input pl-10"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text/72">Full name</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    placeholder="Dmitriy Elat"
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text/72">Primary role</label>
                  <select value={role} onChange={(event) => setRole(event.target.value)} className="app-input">
                    <option>Producer</option>
                    <option>Artist</option>
                    <option>Composer</option>
                    <option>Developer</option>
                    <option>Team Lead</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text/72">Main goal</label>
                  <select value={goal} onChange={(event) => setGoal(event.target.value)} className="app-input">
                    <option>Generate audio ideas faster</option>
                    <option>Build MIDI themes</option>
                    <option>Create preset libraries</option>
                    <option>Test AI audio workflows</option>
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-input border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="app-btn-primary w-full py-3">
              {busy ? "Please wait..." : copy.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
