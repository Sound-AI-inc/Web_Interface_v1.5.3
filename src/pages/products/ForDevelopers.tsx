import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import {
  Terminal,
  Cloud,
  Webhook,
  Key,
  Layers,
  Gauge,
  ArrowRight,
  Code2,
  Cpu,
  Globe,
} from "lucide-react";

const features = [
  { icon: Terminal, title: "REST & GraphQL API", desc: "Flexible endpoints for text-to-audio, MIDI, and preset generation." },
  { icon: Gauge, title: "Usage-Based Pricing", desc: "Pay only for what you generate. Transparent, scalable pricing." },
  { icon: Layers, title: "Multi-Format Endpoints", desc: "Request audio, MIDI, presets, or all formats from a single call." },
  { icon: Webhook, title: "Webhooks", desc: "Real-time event notifications for generation status and delivery." },
  { icon: Cloud, title: "Scalable Cloud Backend", desc: "Enterprise-grade infrastructure handling millions of generation requests." },
  { icon: Cpu, title: "DAW & Platform Integration", desc: "SDKs for integrating into DAWs, games, apps, and web platforms." },
];

const codeExample = `// Generate a production-ready audio sample
const response = await fetch('https://api.soundai.studio/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Dark ambient pad, 120 BPM, A minor',
    formats: ['wav', 'midi', 'preset', 'metadata'],
    options: {
      bpm: 120,
      key: 'Am',
      duration: 8,
      quality: 'high'
    }
  })
});

const { assets } = await response.json();
// assets.audio  → .wav download URL
// assets.midi   → .mid download URL
// assets.preset → .fxp download URL
// assets.meta   → { bpm, key, scale, genre, tags }`;

export default function ForDevelopers() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 -right-32 w-96 h-96 bg-accent-cyan/15 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 mb-6">
              For Developers
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              AI Audio
              <br />
              <span className="gradient-text">Infrastructure</span>
            </h1>
            <p className="text-light-bg/60 text-lg md:text-xl leading-relaxed mb-8">
              Integrate modular AI audio generation into your applications, games, and platforms. Production-ready API with multi-format output and cloud-scale delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/api" className="btn-primary">
                Access API Documentation <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/docs" className="btn-secondary">
                View SDKs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Quick Start"
            title="Generate Audio in Minutes"
            subtitle="Simple, powerful API for text-to-audio, MIDI, and preset generation."
          />
          <div className="max-w-4xl mx-auto">
            <div className="bg-dark-bg/60 border border-white/5 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-accent-pink/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <span className="ml-3 text-xs text-light-bg/30 font-mono">generate.js</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
                <code className="text-light-bg/70 font-mono">{codeExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="Platform Features"
            title="Built for Scale"
            subtitle="Everything you need to integrate AI audio generation into your product."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card group">
                <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                  <f.icon className="w-5 h-5 text-accent-cyan" />
                </div>
                <h3 className="font-poppins font-semibold mb-2">{f.title}</h3>
                <p className="text-light-bg/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Integrations"
            title="Works Where You Build"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Code2, label: "Web Apps" },
              { icon: Cpu, label: "Game Engines" },
              { icon: Globe, label: "Platforms" },
              { icon: Key, label: "Secure Auth" },
            ].map((item) => (
              <div key={item.label} className="card text-center py-8">
                <item.icon className="w-8 h-8 text-accent-pink mx-auto mb-3" />
                <p className="font-poppins font-semibold text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-max text-center">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl mb-4">Start Building Today</h2>
          <p className="text-light-bg/60 max-w-xl mx-auto mb-8">
            Get API access and start integrating AI audio generation into your product.
          </p>
          <Link to="/api" className="btn-primary px-8 py-4 text-base">
            Access API Documentation <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
