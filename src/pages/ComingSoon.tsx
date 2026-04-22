import { Link } from "react-router-dom";
import { Rocket, ArrowLeft, Mail, Bell } from "lucide-react";
import { useState } from "react";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-pink/5 rounded-full blur-3xl" />

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10 text-center py-20">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-light-bg/50 hover:text-accent-pink transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-pink/20 to-accent-cyan/20 border border-gray-200 dark:border-white/10 flex items-center justify-center mx-auto mb-8">
          <Rocket className="w-10 h-10 text-accent-pink" />
        </div>

        {/* Heading */}
        <h1 className="font-poppins font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 text-gray-900 dark:text-light-bg">
          Product in{" "}
          <span className="gradient-text">Development</span>
        </h1>

        <p className="text-gray-500 dark:text-light-bg/60 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
          We're building something incredible. SoundAI's full platform is currently in active development
          and will be available soon.
        </p>

        <p className="text-gray-400 dark:text-light-bg/40 text-base max-w-xl mx-auto mb-10">
          Sign up for beta access to be among the first creators to generate production-ready
          audio samples, MIDI patterns, and VST presets with AI.
        </p>

        {/* Beta signup form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-10">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-light-bg/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-light-bg placeholder-gray-400 dark:placeholder-light-bg/30 focus:outline-none focus:border-accent-pink/50 focus:ring-1 focus:ring-accent-pink/20 transition-all text-sm"
                />
              </div>
              <button type="submit" className="btn-primary px-6 py-3 whitespace-nowrap">
                <Bell className="w-4 h-4 mr-2" />
                Request Beta
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto mb-10 bg-green-500/10 border border-green-500/20 rounded-xl p-5">
            <p className="text-green-600 dark:text-green-400 font-semibold text-sm mb-1">
              You're on the list!
            </p>
            <p className="text-gray-500 dark:text-light-bg/50 text-sm">
              We'll notify <span className="font-medium text-gray-700 dark:text-light-bg/70">{email}</span> when
              beta access is available.
            </p>
          </div>
        )}

        {/* Features coming */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { label: "Text-to-Audio Generation", status: "In Progress" },
            { label: "MIDI & Preset Export", status: "Coming Soon" },
            { label: "DAW Plugin Integration", status: "Planned" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl p-4"
            >
              <p className="text-gray-900 dark:text-light-bg text-sm font-semibold mb-1">{item.label}</p>
              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-accent-pink/10 text-accent-pink font-medium">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p className="text-gray-400 dark:text-light-bg/30 text-sm">
          Join 2,000+ producers already on the waitlist
        </p>
      </div>
    </section>
  );
}
