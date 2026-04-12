import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import {
  BookOpen,
  Key,
  Terminal,
  Layers,
  Webhook,
  Code2,
  FileAudio,
  Gauge,
  ArrowRight,
  Search,
} from "lucide-react";

const sections = [
  { icon: BookOpen, title: "Getting Started", desc: "Quick start guide, installation, and first generation.", tag: "Beginner" },
  { icon: Key, title: "Authentication", desc: "API key management, OAuth2, and secure token handling.", tag: "Setup" },
  { icon: Terminal, title: "API Reference", desc: "Complete endpoint documentation with request/response examples.", tag: "Reference" },
  { icon: Layers, title: "Generation Endpoints", desc: "Text-to-audio, MIDI, preset, and multi-format generation.", tag: "Core" },
  { icon: Webhook, title: "Webhooks", desc: "Real-time event notifications and callback configuration.", tag: "Advanced" },
  { icon: Code2, title: "SDKs", desc: "Official SDKs for Python, JavaScript, and C++ integration.", tag: "Libraries" },
  { icon: FileAudio, title: "Export Formats", desc: "Supported audio, MIDI, preset, and metadata formats.", tag: "Reference" },
  { icon: Gauge, title: "Rate Limits", desc: "API rate limits, quotas, and best practices for optimization.", tag: "Operations" },
];

export default function Documentation() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Documentation"
            title="Developer Documentation"
            subtitle="Everything you need to integrate SoundAI into your applications and workflows."
          />

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-light-bg/30" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full bg-gray-100 dark:bg-dark-bg/60 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-gray-900 dark:text-light-bg placeholder:text-gray-300 dark:text-light-bg/30 focus:outline-none focus:border-accent-cyan/50"
              />
            </div>
          </div>

          {/* Sections grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sections.map((s) => (
              <Link key={s.title} to="/api" className="card group hover:border-accent-cyan/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
                    <s.icon className="w-4.5 h-4.5 text-accent-cyan" />
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-light-bg/30">{s.tag}</span>
                </div>
                <h3 className="font-poppins font-semibold text-sm mb-1 group-hover:text-accent-cyan transition-colors">
                  {s.title}
                </h3>
                <p className="text-gray-400 dark:text-light-bg/40 text-xs leading-relaxed">{s.desc}</p>
              </Link>
            ))}
          </div>

          {/* Quick links */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 dark:text-light-bg/40 text-sm mb-4">Need help getting started?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/api" className="btn-primary text-xs">
                API Reference <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
              <Link to="/support" className="btn-secondary text-xs">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
