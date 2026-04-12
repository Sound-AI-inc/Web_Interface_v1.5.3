import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import {
  TrendingUp,
  Users,
  Brain,
  Layers,
  DollarSign,
  Server,
  Shield,
  ArrowRight,
  BarChart3,
} from "lucide-react";

const sections = [
  {
    icon: TrendingUp,
    title: "Market Opportunity",
    items: [
      "Global music production software market projected to reach $8.2B by 2028",
      "AI music tools market growing at 28% CAGR",
      "Demand for modular, rights-compliant generation tools accelerating",
      "Enterprise adoption of AI audio tools in media, gaming, and advertising",
    ],
  },
  {
    icon: Users,
    title: "Creator Economy Growth",
    items: [
      "50M+ active music producers worldwide",
      "Creator economy valued at $100B+ and growing",
      "Rising demand for faster, more accessible production tools",
      "Independent artists represent the fastest-growing segment",
    ],
  },
  {
    icon: Brain,
    title: "AI Music Expansion",
    items: [
      "Rapid advances in generative audio models",
      "Text-to-audio becoming production-viable",
      "Growing acceptance of AI as creative tool, not replacement",
      "Regulatory clarity emerging around AI-generated content",
    ],
  },
  {
    icon: Layers,
    title: "Modular Advantage",
    items: [
      "Unique position: modular assets vs. full-track generation",
      "Addresses legal concerns around full AI-generated songs",
      "Integrates directly into existing DAW workflows",
      "Higher creator adoption due to editability and control",
    ],
  },
];

const businessModel = [
  { icon: DollarSign, title: "Subscription", desc: "Tiered plans for individual creators and teams with monthly generation credits." },
  { icon: BarChart3, title: "Marketplace", desc: "Revenue share from creator-to-creator asset sales and curated collections." },
  { icon: Server, title: "API", desc: "Usage-based pricing for developers and enterprises integrating generation capabilities." },
];

const risks = [
  "Evolving regulatory landscape for AI-generated content",
  "Competition from large tech companies entering audio AI",
  "Dependence on compute infrastructure costs",
  "Creator adoption requires education and trust-building",
];

export default function ForInvestors() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-accent-pink/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-pink/10 text-accent-pink border border-accent-pink/20 mb-6">
              Investor Information
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              The Future of
              <br />
              <span className="gradient-text">Music Production AI</span>
            </h1>
            <p className="text-light-bg/60 text-lg md:text-xl leading-relaxed mb-8">
              SoundAI is building the modular AI audio infrastructure for the next generation of music creators, developers, and enterprises.
            </p>
            <Link to="/support" className="btn-primary">
              Request Investor Information <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="section-padding">
        <div className="container-max">
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((s) => (
              <div key={s.title} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-accent-pink" />
                  </div>
                  <h3 className="font-poppins font-semibold text-lg">{s.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-light-bg/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-pink mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="section-padding waveform-bg">
        <div className="container-max">
          <SectionHeading
            badge="Business Model"
            title="Subscription + Marketplace + API"
            subtitle="Three complementary revenue streams designed for scale."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {businessModel.map((bm) => (
              <div key={bm.title} className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-4">
                  <bm.icon className="w-6 h-6 text-accent-cyan" />
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2">{bm.title}</h3>
                <p className="text-light-bg/50 text-sm">{bm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="section-padding">
        <div className="container-max max-w-4xl">
          <SectionHeading
            badge="Infrastructure"
            title="Built for Scale"
            subtitle="Cloud-native architecture designed to handle millions of generation requests."
          />
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "50ms", label: "API Latency" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "10M+", label: "Monthly Capacity" },
                { value: "3", label: "Global Regions" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-poppins font-bold text-2xl gradient-text">{stat.value}</p>
                  <p className="text-light-bg/40 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Risk Mitigation */}
      <section className="section-padding waveform-bg">
        <div className="container-max max-w-4xl">
          <SectionHeading
            badge="Risk Mitigation"
            title="Addressing Key Challenges"
          />
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-yellow-400" />
              <h3 className="font-poppins font-semibold">Key Considerations</h3>
            </div>
            <ul className="space-y-3">
              {risks.map((risk) => (
                <li key={risk} className="flex items-start gap-2 text-sm text-light-bg/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Disclaimer + CTA */}
      <section className="section-padding">
        <div className="container-max max-w-4xl text-center">
          <div className="bg-dark-bg/40 border border-white/5 rounded-xl p-6 mb-8">
            <p className="text-light-bg/40 text-xs leading-relaxed">
              This material is for informational purposes only and does not constitute an offer to sell securities.
              SoundAI does not make forward-looking statements or financial guarantees. All market projections are
              based on publicly available third-party research and are subject to change.
            </p>
          </div>
          <h2 className="font-poppins font-bold text-3xl mb-4">Learn More</h2>
          <p className="text-light-bg/60 max-w-xl mx-auto mb-8">
            Interested in learning more about SoundAI's vision and growth trajectory?
          </p>
          <Link to="/support" className="btn-primary px-8 py-4 text-base">
            Request Investor Information <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
