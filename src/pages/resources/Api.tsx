import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import { ArrowRight, Shield, Zap, Cloud, Globe } from "lucide-react";

const endpoints = [
  {
    method: "POST",
    path: "/v1/generate",
    desc: "Generate audio, MIDI, presets, and metadata from a text prompt.",
  },
  {
    method: "GET",
    path: "/v1/assets/{id}",
    desc: "Retrieve a generated asset by ID with download URLs.",
  },
  {
    method: "POST",
    path: "/v1/generate/batch",
    desc: "Batch generation of multiple assets from an array of prompts.",
  },
  {
    method: "GET",
    path: "/v1/assets/{id}/status",
    desc: "Check generation status and progress for async requests.",
  },
  {
    method: "POST",
    path: "/v1/webhooks",
    desc: "Register webhook endpoints for generation event notifications.",
  },
  {
    method: "GET",
    path: "/v1/usage",
    desc: "Retrieve API usage statistics and remaining quota.",
  },
];

const responseExample = `{
  "id": "gen_8x7k2m9p",
  "status": "completed",
  "prompt": "Dark ambient pad, 120 BPM, A minor",
  "assets": {
    "audio": {
      "url": "https://cdn.soundai.studio/gen_8x7k2m9p.wav",
      "format": "wav",
      "duration": 8.0,
      "sample_rate": 48000
    },
    "midi": {
      "url": "https://cdn.soundai.studio/gen_8x7k2m9p.mid",
      "format": "midi",
      "tracks": 1
    },
    "preset": {
      "url": "https://cdn.soundai.studio/gen_8x7k2m9p.fxp",
      "format": "fxp",
      "plugin": "SoundAI Synth"
    },
    "metadata": {
      "bpm": 120,
      "key": "Am",
      "scale": "natural_minor",
      "genre": "ambient",
      "tags": ["dark", "pad", "analog", "atmospheric"]
    }
  },
  "created_at": "2026-03-15T10:30:00Z"
}`;

export default function Api() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 mb-6">
              API Reference
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl leading-tight mb-6">
              SoundAI <span className="gradient-text">API</span>
            </h1>
            <p className="text-gray-500 dark:text-light-bg/60 text-lg leading-relaxed mb-8">
              REST and GraphQL endpoints for AI audio generation. JSON responses, secure authentication, and cloud-hosted asset delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/docs" className="btn-primary text-sm">
                Get API Key <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/docs" className="btn-secondary text-sm">
                View Full Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "REST + GraphQL", desc: "Flexible query methods" },
              { icon: Shield, label: "Secure Auth", desc: "API key + OAuth2" },
              { icon: Cloud, label: "Cloud Delivery", desc: "CDN-hosted assets" },
              { icon: Globe, label: "Global Edge", desc: "Low-latency access" },
            ].map((item) => (
              <div key={item.label} className="card text-center py-6">
                <item.icon className="w-7 h-7 text-accent-cyan mx-auto mb-3" />
                <p className="font-poppins font-semibold text-sm">{item.label}</p>
                <p className="text-gray-400 dark:text-light-bg/40 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="Endpoints"
            title="Core API Endpoints"
            subtitle="Key endpoints for generating, retrieving, and managing audio assets."
          />
          <div className="max-w-4xl mx-auto space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.path} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-mono font-bold rounded ${
                    ep.method === "POST"
                      ? "bg-accent-pink/10 text-accent-pink"
                      : "bg-accent-cyan/10 text-accent-cyan"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-gray-600 dark:text-light-bg/70 flex-1">{ep.path}</code>
                <p className="text-gray-400 dark:text-light-bg/40 text-xs sm:text-right sm:max-w-xs">{ep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Response Example */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Response"
            title="Example Response"
            subtitle="JSON response from the /v1/generate endpoint."
          />
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 dark:bg-dark-bg/60 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/5">
                <div className="w-3 h-3 rounded-full bg-accent-pink/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <span className="ml-3 text-xs text-gray-300 dark:text-light-bg/30 font-mono">200 OK — application/json</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm leading-relaxed">
                <code className="text-gray-600 dark:text-light-bg/70 font-mono">{responseExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
