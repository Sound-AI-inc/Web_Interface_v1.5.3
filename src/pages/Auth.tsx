import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl" />

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-light-bg/50 hover:text-accent-pink transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Card */}
          <div className="bg-white dark:bg-dark-deeper border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center">
                <span className="text-white font-poppins font-bold text-lg">S</span>
              </div>
              <span className="font-poppins font-bold text-xl text-gray-900 dark:text-light-bg">SoundAI</span>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "login"
                    ? "bg-white dark:bg-dark-bg text-gray-900 dark:text-light-bg shadow-sm"
                    : "text-gray-500 dark:text-light-bg/50 hover:text-gray-700 dark:hover:text-light-bg/70"
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === "signup"
                    ? "bg-white dark:bg-dark-bg text-gray-900 dark:text-light-bg shadow-sm"
                    : "text-gray-500 dark:text-light-bg/50 hover:text-gray-700 dark:hover:text-light-bg/70"
                }`}
              >
                Sign Up
              </button>
            </div>

            <h2 className="font-poppins font-bold text-2xl text-center mb-2 text-gray-900 dark:text-light-bg">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-gray-500 dark:text-light-bg/50 text-sm text-center mb-6">
              {mode === "login"
                ? "Sign in to continue to SoundAI"
                : "Start creating with AI-powered audio tools"}
            </p>

            {/* Social buttons */}
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-light-bg/80 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-light-bg/80 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Continue with Spotify
              </button>

              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-light-bg/80 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-dark-deeper text-gray-400 dark:text-light-bg/40">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-light-bg/70 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-light-bg/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-light-bg placeholder-gray-400 dark:placeholder-light-bg/30 focus:outline-none focus:border-accent-pink/50 focus:ring-1 focus:ring-accent-pink/20 transition-all text-sm"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3">
                {mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Footer text */}
            <p className="text-gray-400 dark:text-light-bg/30 text-xs text-center mt-6 leading-relaxed">
              By continuing, you agree to SoundAI's{" "}
              <Link to="/legal/terms" className="text-accent-pink hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link to="/legal/privacy" className="text-accent-pink hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
