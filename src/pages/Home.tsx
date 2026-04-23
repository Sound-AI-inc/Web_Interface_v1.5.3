import { Link } from "react-router-dom";
import {
  AudioWaveform,
  Music2,
  Settings2,
  FileAudio,
  ArrowRight,
  Zap,
  Shield,
  Layers,
  Terminal,
  Users,
  Globe,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";

const features = [
  {
    icon: AudioWaveform,
    title: "Text-to-Audio Samples",
    desc: "Generate production-ready audio samples from natural language prompts.",
  },
  {
    icon: Music2,
    title: "Editable MIDI",
    desc: "AI-generated MIDI patterns you can edit, transpose, and arrange in your DAW.",
  },
  {
    icon: Settings2,
    title: "VST Preset Generation",
    desc: "Synthesizer presets tailored to your prompt, ready for your plugin chain.",
  },
  {
    icon: FileAudio,
    title: "Multi-Format Sync",
    desc: "Audio, MIDI, presets, and metadata — synchronized from a single prompt.",
  },
  {
    icon: Zap,
    title: "One-Click DAW Export",
    desc: "Export directly to Ableton, FL Studio, Logic Pro — no conversion needed.",
  },
  {
    icon: Shield,
    title: "Rights-Aware Outputs",
    desc: "Every asset generated with compliance metadata and clear usage rights.",
  },
];

const useCases = [
  {
    icon: Users,
    title: "For Creators",
    desc: "Accelerate your workflow with AI-generated building blocks that fit your creative vision.",
    to: "/products/users",
  },
  {
    icon: Terminal,
    title: "For Developers",
    desc: "Integrate AI audio generation into your apps, games, and platforms via our API.",
    to: "/products/developers",
  },
  {
    icon: Globe,
    title: "For Partners",
    desc: "Join our ecosystem of DAW makers, plugin developers, and music institutions.",
    to: "/products/partnerships",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center waveform-bg overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl" />

        <div className="container-max section-padding relative z-10">
          <div className="max-w-4xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-pink/10 text-accent-pink border border-accent-pink/20 mb-6">
              AI-Powered Music Production
            </span>
            <h1 className="font-poppins font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6">
              Create Production-Ready
              <br />
              Audio with{" "}
              <span className="gradient-text">AI</span>
            </h1>
            <p className="text-gray-500 dark:text-light-bg/60 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
              From Prompt to Samples, MIDI &amp; Presets — Built for Real Workflows.
              Generate modular, editable production assets designed for professional DAWs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products/users" className="btn-primary text-base px-8 py-4">
                Start Creating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/about" className="btn-secondary text-base px-8 py-4">
                Join Beta
              </Link>
            </div>
          </div>

          {/* Prompt → Output Diagram */}
          <div className="mt-16 md:mt-24">
            <div className="relative bg-gray-100 dark:bg-dark-bg/40 backdrop-blur border border-gray-200 dark:border-white/5 rounded-2xl p-6 md:p-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-accent-pink/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
              </div>
              <div className="font-mono text-sm text-gray-500 dark:text-light-bg/50 mb-3">$ soundai generate</div>
              <div className="bg-gray-50 dark:bg-dark-deeper/60 rounded-lg p-4 mb-4 border border-gray-200 dark:border-white/5">
                <p className="text-accent-cyan font-mono text-sm">
                  &gt; "Dark ambient pad, 120 BPM, A minor, with analog warmth"
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Audio Sample", ext: ".wav" },
                  { label: "MIDI Pattern", ext: ".mid" },
                  { label: "VST Preset", ext: ".fxp" },
                  { label: "Metadata", ext: ".json" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gray-100 dark:bg-dark-bg/60 border border-accent-pink/10 rounded-lg p-3 text-center"
                  >
                    <Layers className="w-5 h-5 text-accent-pink mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-900 dark:text-light-bg">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-light-bg/40 font-mono">{item.ext}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="Capabilities"
            title="Modular AI for Real Production"
            subtitle="Every asset is editable, exportable, and designed to integrate seamlessly into professional workflows."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card group">
                <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center mb-4 group-hover:bg-accent-pink/20 transition-colors">
                  <f.icon className="w-5 h-5 text-accent-pink" />
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Use Cases"
            title="Built for Every Workflow"
            subtitle="Whether you're a solo producer, a development team, or an enterprise partner."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <Link
                key={uc.title}
                to={uc.to}
                className="card group flex flex-col hover:border-accent-cyan/20"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                  <uc.icon className="w-6 h-6 text-accent-cyan" />
                </div>
                <h3 className="font-poppins font-semibold text-xl mb-2">{uc.title}</h3>
                <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed flex-1">{uc.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-accent-pink text-sm font-semibold">
                  Learn More <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-max">
          <div className="relative bg-gradient-to-br from-accent-pink/10 to-accent-cyan/10 border border-gray-200 dark:border-white/5 rounded-2xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-4">
                Ready to Accelerate Your Workflow?
              </h2>
              <p className="text-gray-500 dark:text-light-bg/60 max-w-xl mx-auto mb-8">
                Generate modular audio assets from natural language. Built for professional producers and developers.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/products/users" className="btn-primary px-8 py-4 text-base">
                  Start Creating
                </Link>
                <Link to="/about" className="btn-secondary px-8 py-4 text-base">
                  Request Beta Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
