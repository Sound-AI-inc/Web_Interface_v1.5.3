import SectionHeading from "../../components/SectionHeading";
import { Rocket, Monitor, Store, Terminal, Building2, CheckCircle2, Clock } from "lucide-react";

const milestones = [
  {
    icon: Rocket,
    title: "Public Launch",
    quarter: "Q2 2026",
    status: "current",
    items: [
      "Web-based generation platform",
      "Core text-to-audio pipeline",
      "MIDI and preset generation",
      "Multi-format DAW export",
      "Creator beta program",
    ],
  },
  {
    icon: Monitor,
    title: "Desktop App (Win/macOS)",
    quarter: "Q3 2026",
    status: "upcoming",
    items: [
      "Native desktop application",
      "Offline generation mode",
      "Direct DAW plugin integration",
      "Local asset library management",
      "Drag-and-drop workflow",
    ],
  },
  {
    icon: Store,
    title: "Creator Marketplace",
    quarter: "Q4 2026",
    status: "upcoming",
    items: [
      "Asset marketplace for creators",
      "Sell and share generated assets",
      "Curated collections",
      "Community ratings and reviews",
      "Creator monetization tools",
    ],
  },
  {
    icon: Terminal,
    title: "Developer API",
    quarter: "Q1 2027",
    status: "upcoming",
    items: [
      "RESTful API public access",
      "GraphQL endpoints",
      "SDK for Python, JS, and C++",
      "Webhook event system",
      "Usage-based pricing",
    ],
  },
  {
    icon: Building2,
    title: "Enterprise Solutions",
    quarter: "Q2 2027",
    status: "upcoming",
    items: [
      "Custom model fine-tuning",
      "Enterprise SSO and compliance",
      "Dedicated infrastructure",
      "Volume licensing",
      "Priority support SLA",
    ],
  },
];

export default function Roadmap() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-pink/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Roadmap"
            title="Building the Future of Audio Production"
            subtitle="Our product roadmap emphasizes scalability, ecosystem growth, and creator-first innovation."
          />

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-pink via-accent-cyan to-accent-pink/20" />

            {milestones.map((m, i) => (
              <div
                key={m.title}
                className={`relative flex flex-col md:flex-row items-start gap-6 mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-accent-pink bg-dark-deeper z-10">
                  {m.status === "current" && (
                    <div className="absolute inset-0 rounded-full bg-accent-pink animate-ping opacity-30" />
                  )}
                </div>

                {/* Content */}
                <div className={`ml-14 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                  <div className={`card ${m.status === "current" ? "border-accent-pink/30 bg-accent-pink/5" : ""}`}>
                    <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                      <m.icon className={`w-5 h-5 ${m.status === "current" ? "text-accent-pink" : "text-accent-cyan"}`} />
                      <span className="font-poppins font-bold text-lg">{m.title}</span>
                    </div>
                    <div className={`flex items-center gap-2 mb-4 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                      {m.status === "current" ? (
                        <Clock className="w-3.5 h-3.5 text-accent-pink" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-light-bg/30" />
                      )}
                      <span className={`text-xs font-semibold ${m.status === "current" ? "text-accent-pink" : "text-light-bg/40"}`}>
                        {m.quarter}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {m.items.map((item) => (
                        <li key={item} className={`text-sm text-light-bg/50 flex items-start gap-2 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                          <span className="w-1 h-1 rounded-full bg-accent-cyan mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
