import { Link } from "react-router-dom";
import {
  ArrowRight,
  AudioWaveform,
  FileAudio,
  Settings2,
  Music2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import SectionHeading from "../../components/SectionHeading";

const benefits = [
  {
    icon: CheckCircle2,
    title: "Editable & Modular",
    desc: "Every generated asset can be modified, layered, and rearranged in your DAW.",
  },
  {
    icon: CheckCircle2,
    title: "DAW-Native Export",
    desc: "Direct export to Ableton, FL Studio, Logic Pro with zero conversion steps.",
  },
  {
    icon: CheckCircle2,
    title: "Synchronized Assets",
    desc: "Audio, MIDI, presets, and metadata are generated in sync from a single prompt.",
  },
  {
    icon: CheckCircle2,
    title: "Compliance-Ready",
    desc: "Clear usage rights and metadata for every generated asset.",
  },
];

const constraints = [
  "Full AI-generated tracks face legal and copyright ambiguity",
  "Complete songs lack the editability producers need",
  "Monolithic outputs don't integrate with existing DAW workflows",
  "Quality control is harder with full-track generation",
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent-pink/15 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-pink/10 text-accent-pink border border-accent-pink/20 mb-6">
              About SoundAI
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Accelerate Music Production with{" "}
              <span className="gradient-text">Modular AI</span>
            </h1>
            <p className="text-light-bg/60 text-lg md:text-xl leading-relaxed mb-8">
              SoundAI generates editable samples, MIDI patterns, VST presets, and structured metadata
              from natural language prompts — purpose-built for real production workflows in professional DAWs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products/users" className="btn-primary">
                Start Creating <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/about" className="btn-secondary">
                Request Beta Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Modular */}
      <section className="section-padding">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <SectionHeading
                badge="Why Modular?"
                title="The Problem with Full-Track AI"
                centered={false}
              />
              <div className="space-y-4">
                {constraints.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-light-bg/60 text-sm">{c}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionHeading
                badge="Our Approach"
                title="Modular Assets, Full Control"
                centered={false}
              />
              <div className="space-y-4">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <b.icon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-poppins font-semibold text-sm">{b.title}</h4>
                      <p className="text-light-bg/50 text-sm">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagram */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="How It Works"
            title="One Prompt — Multi-Format Output"
            subtitle="A single natural language prompt generates synchronized, production-ready assets."
          />
          <div className="max-w-4xl mx-auto">
            {/* Prompt input */}
            <div className="bg-dark-bg/60 border border-white/5 rounded-xl p-6 mb-6 text-center">
              <Sparkles className="w-8 h-8 text-accent-pink mx-auto mb-3" />
              <p className="font-poppins font-semibold text-lg mb-1">Natural Language Prompt</p>
              <p className="text-light-bg/40 text-sm italic">
                "Warm analog pad, 90 BPM, C minor, with slow attack and ambient tail"
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center mb-6">
              <div className="w-px h-12 bg-gradient-to-b from-accent-pink to-accent-cyan" />
            </div>

            {/* Outputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: AudioWaveform, label: "Audio Sample", format: ".wav / .flac", color: "text-accent-pink" },
                { icon: Music2, label: "MIDI Pattern", format: ".mid", color: "text-accent-cyan" },
                { icon: Settings2, label: "VST Preset", format: ".fxp / .vstpreset", color: "text-purple-400" },
                { icon: FileAudio, label: "Metadata", format: ".json", color: "text-yellow-400" },
              ].map((item) => (
                <div key={item.label} className="card text-center">
                  <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                  <h4 className="font-poppins font-semibold text-sm mb-1">{item.label}</h4>
                  <p className="text-light-bg/40 text-xs font-mono">{item.format}</p>
                </div>
              ))}
            </div>

            {/* Sync note */}
            <div className="mt-6 bg-accent-cyan/5 border border-accent-cyan/10 rounded-xl p-4 flex items-start gap-3">
              <Layers className="w-5 h-5 text-accent-cyan mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-poppins font-semibold text-sm text-accent-cyan">Asset Synchronization</h4>
                <p className="text-light-bg/50 text-sm">
                  All outputs share BPM, key, scale, and timing data — ensuring perfect alignment when loaded into your DAW project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-max text-center">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-4">
            Ready to Build with Modular AI?
          </h2>
          <p className="text-light-bg/60 max-w-xl mx-auto mb-8">
            Join the beta and start generating production-ready assets from natural language.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products/users" className="btn-primary px-8 py-4">
              Start Creating
            </Link>
            <Link to="/about" className="btn-secondary px-8 py-4">
              Request Beta Access
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
