import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import {
  AudioWaveform,
  Music2,
  Settings2,
  FileAudio,
  Zap,
  Brain,
  Layers,
  Edit3,
  Shield,
  Download,
  ArrowRight,
} from "lucide-react";

const capabilities = [
  { icon: AudioWaveform, label: "Text-to-Audio Samples", desc: "Generate high-quality audio samples from natural language descriptions." },
  { icon: Music2, label: "Editable MIDI", desc: "AI-generated MIDI patterns ready for editing, transposing, and arranging." },
  { icon: Settings2, label: "VST Preset Generation", desc: "Synthesizer and effect presets matching your prompt's tonal character." },
  { icon: Layers, label: "Multi-Format Sync", desc: "All assets share BPM, key, and timing data for perfect DAW alignment." },
  { icon: Download, label: "One-Click DAW Export", desc: "Direct export to Ableton Live, FL Studio, and Logic Pro." },
  { icon: FileAudio, label: "BPM, Key & Genre Metadata", desc: "Every asset includes structured metadata for library management." },
];

const featureBlocks = [
  {
    icon: Brain,
    title: "Natural Language Understanding",
    desc: "Describe what you hear in your head. Our models understand musical concepts, genres, moods, textures, and production techniques. No presets to browse — just describe your sound.",
    iconBg: "bg-accent-pink/10",
    iconColor: "text-accent-pink",
  },
  {
    icon: Layers,
    title: "Multi-Modal Generation",
    desc: "One prompt generates synchronized audio, MIDI, presets, and metadata. Each output is a standalone asset that works independently or together as a cohesive unit.",
    iconBg: "bg-accent-cyan/10",
    iconColor: "text-accent-cyan",
  },
  {
    icon: Download,
    title: "DAW-Ready Export",
    desc: "Export assets directly into your project. We support Ableton Live (.als), FL Studio (.flp), Logic Pro, and standard formats like WAV, MIDI, and FXP.",
    iconBg: "bg-accent-pink/10",
    iconColor: "text-accent-pink",
  },
  {
    icon: Edit3,
    title: "Modular Editing",
    desc: "Every generated asset is fully editable. Adjust MIDI notes, tweak preset parameters, slice audio samples — you maintain complete creative control.",
    iconBg: "bg-accent-cyan/10",
    iconColor: "text-accent-cyan",
  },
  {
    icon: Shield,
    title: "Rights-Aware Outputs",
    desc: "All generated assets include clear usage rights and compliance metadata. Use them in commercial releases, sync licensing, and streaming distribution with confidence.",
    iconBg: "bg-accent-pink/10",
    iconColor: "text-accent-pink",
  },
];

export default function ForUsers() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent-pink/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="For Creators"
            title="Your Sound. AI-Accelerated."
            subtitle="Generate production-ready audio samples, MIDI patterns, VST presets, and metadata from natural language — built for your DAW workflow."
          />

          {/* UI Mockup */}
          <div className="max-w-4xl mx-auto bg-dark-bg/40 backdrop-blur border border-white/5 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-accent-pink/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-light-bg/30 font-mono">SoundAI Studio</span>
            </div>
            <div className="bg-dark-deeper/60 rounded-lg p-4 border border-white/5 mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent-pink" />
                <input
                  type="text"
                  disabled
                  value="Lo-fi hip-hop chords, 85 BPM, Eb major, dusty vinyl texture..."
                  className="flex-1 bg-transparent text-light-bg/70 text-sm font-mono outline-none"
                />
                <button className="btn-primary text-xs px-4 py-1.5">Generate</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Chord Loop", type: ".wav", size: "2.4 MB", color: "bg-accent-pink/10 text-accent-pink" },
                { label: "MIDI Chords", type: ".mid", size: "4 KB", color: "bg-accent-cyan/10 text-accent-cyan" },
                { label: "Synth Preset", type: ".fxp", size: "12 KB", color: "bg-purple-400/10 text-purple-400" },
                { label: "Metadata", type: ".json", size: "1 KB", color: "bg-yellow-400/10 text-yellow-400" },
              ].map((item) => (
                <div key={item.label} className="bg-dark-bg/60 border border-white/5 rounded-lg p-3">
                  <div className={`w-8 h-8 rounded-md ${item.color.split(" ")[0]} flex items-center justify-center mb-2`}>
                    <FileAudio className={`w-4 h-4 ${item.color.split(" ")[1]}`} />
                  </div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-xs text-light-bg/30 font-mono">{item.type} · {item.size}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Capabilities"
            title="Everything You Need to Create"
            subtitle="From prompt to production — modular assets built for real workflows."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.label} className="card group">
                <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center mb-4 group-hover:bg-accent-pink/20 transition-colors">
                  <cap.icon className="w-5 h-5 text-accent-pink" />
                </div>
                <h3 className="font-poppins font-semibold mb-2">{cap.label}</h3>
                <p className="text-light-bg/50 text-sm leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="Features"
            title="Designed for Professional Workflows"
          />
          <div className="space-y-8 max-w-4xl mx-auto">
            {featureBlocks.map((fb, i) => (
              <div key={fb.title} className={`card flex flex-col md:flex-row items-start gap-6 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}>
                <div className={`w-14 h-14 rounded-xl ${fb.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <fb.icon className={`w-7 h-7 ${fb.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl mb-2">{fb.title}</h3>
                  <p className="text-light-bg/50 leading-relaxed">{fb.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-max text-center">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-4">Create Your First Asset</h2>
          <p className="text-light-bg/60 max-w-xl mx-auto mb-8">
            Start generating production-ready audio, MIDI, and presets from natural language.
          </p>
          <Link to="/about" className="btn-primary px-8 py-4 text-base">
            Start Creating <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
