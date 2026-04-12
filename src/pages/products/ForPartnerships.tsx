import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import {
  Monitor,
  Puzzle,
  GraduationCap,
  Users,
  Brain,
  Server,
  ArrowRight,
  Handshake,
} from "lucide-react";

const partnerTypes = [
  {
    icon: Monitor,
    title: "DAW Integrations",
    desc: "Deep integration with digital audio workstations. Enable AI generation directly within the production environment your users already know.",
    benefits: ["Native plugin support", "Real-time generation", "Seamless export pipeline"],
  },
  {
    icon: Puzzle,
    title: "Plugin Ecosystem",
    desc: "VST/AU plugin developers can extend SoundAI's generation capabilities. Create preset packs, sound libraries, and custom generation workflows.",
    benefits: ["VST3/AU SDK access", "Co-branded experiences", "Revenue sharing"],
  },
  {
    icon: GraduationCap,
    title: "Music Schools & Education",
    desc: "Bring AI-powered production tools to the classroom. Educational licensing, curriculum integration, and student programs.",
    benefits: ["Educational pricing", "Curriculum materials", "Student certificates"],
  },
  {
    icon: Users,
    title: "Creator Collectives",
    desc: "Teams, labels, and collectives can leverage bulk generation, shared libraries, and collaborative workflows.",
    benefits: ["Team workspaces", "Shared asset libraries", "Collective licensing"],
  },
  {
    icon: Brain,
    title: "AI Research Labs",
    desc: "Collaborate on advancing the state of the art in generative audio. Research partnerships, data sharing, and joint publications.",
    benefits: ["Research API access", "Joint publications", "Model collaboration"],
  },
  {
    icon: Server,
    title: "Infrastructure Partners",
    desc: "Cloud, compute, and delivery partners helping scale AI audio generation globally with low latency and high availability.",
    benefits: ["Infrastructure credits", "Co-optimization", "Global deployment"],
  },
];

export default function ForPartnerships() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute bottom-0 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 mb-6">
              Partnerships
            </span>
            <h1 className="font-poppins font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Build the Audio AI
              <br />
              <span className="gradient-text">Ecosystem Together</span>
            </h1>
            <p className="text-light-bg/60 text-lg md:text-xl leading-relaxed mb-8">
              Partner with SoundAI to bring AI-powered audio generation to DAWs, plugins, education, and creative platforms. Long-term ecosystem alignment over short-term gains.
            </p>
            <Link to="/support" className="btn-primary">
              Explore Partnership Opportunities <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeading
            badge="Partner Programs"
            title="Multiple Ways to Collaborate"
            subtitle="From DAW integrations to research partnerships — find the right program for your organization."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerTypes.map((pt) => (
              <div key={pt.title} className="card group flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                  <pt.icon className="w-6 h-6 text-accent-cyan" />
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2">{pt.title}</h3>
                <p className="text-light-bg/50 text-sm leading-relaxed flex-1 mb-4">{pt.desc}</p>
                <ul className="space-y-1.5">
                  {pt.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-accent-cyan/80">
                      <span className="w-1 h-1 rounded-full bg-accent-cyan" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="section-padding waveform-bg">
        <div className="container-max max-w-4xl text-center">
          <div className="card">
            <Handshake className="w-12 h-12 text-accent-pink mx-auto mb-4" />
            <h3 className="font-poppins font-bold text-2xl mb-3">Long-Term Ecosystem Alignment</h3>
            <p className="text-light-bg/50 leading-relaxed max-w-2xl mx-auto mb-6">
              We believe the future of music production is collaborative. SoundAI partnerships are built on shared value creation,
              transparent communication, and long-term growth — not short-term transactions.
            </p>
            <Link to="/support" className="btn-primary px-8 py-3">
              Explore Partnership Opportunities <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
