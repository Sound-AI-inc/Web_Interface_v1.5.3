import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";

const roles = [
  {
    title: "Senior AI/ML Engineer",
    team: "AI Research",
    location: "Remote / San Francisco",
    type: "Full-Time",
    desc: "Design and train generative audio models. Work on text-to-audio, MIDI synthesis, and preset generation pipelines.",
  },
  {
    title: "Audio ML Researcher",
    team: "AI Research",
    location: "Remote",
    type: "Full-Time",
    desc: "Research novel approaches to neural audio synthesis, latent diffusion for audio, and multi-modal generation.",
  },
  {
    title: "Plugin Developer (VST3/AU)",
    team: "Engineering",
    location: "Remote / Berlin",
    type: "Full-Time",
    desc: "Build native audio plugins integrating SoundAI into professional DAWs. Experience with JUCE framework required.",
  },
  {
    title: "Senior Frontend Engineer",
    team: "Engineering",
    location: "Remote",
    type: "Full-Time",
    desc: "Build the web-based generation platform and asset management interface. React, TypeScript, WebAudio API.",
  },
  {
    title: "Community & Creator Relations",
    team: "Community",
    location: "Remote / Los Angeles",
    type: "Full-Time",
    desc: "Grow and nurture our creator community. Build relationships with producers, beat-makers, and sound designers.",
  },
  {
    title: "Backend Engineer",
    team: "Engineering",
    location: "Remote",
    type: "Full-Time",
    desc: "Build scalable API infrastructure for real-time audio generation, asset delivery, and cloud processing.",
  },
];

export default function Careers() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Careers"
            title="Build the Future of Music Production"
            subtitle="Join a team of musicians, researchers, and engineers pushing the boundaries of AI-powered audio creation."
          />

          <div className="grid gap-4 max-w-4xl mx-auto">
            {roles.map((role) => (
              <div key={role.title} className="card group flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-poppins font-semibold text-lg group-hover:text-accent-pink transition-colors">
                    {role.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 mb-2">
                    <span className="flex items-center gap-1 text-xs text-accent-cyan">
                      <Briefcase className="w-3 h-3" /> {role.team}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-light-bg/40">
                      <MapPin className="w-3 h-3" /> {role.location}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-light-bg/40">
                      {role.type}
                    </span>
                  </div>
                  <p className="text-light-bg/50 text-sm">{role.desc}</p>
                </div>
                <Link
                  to="#"
                  className="btn-primary text-xs px-4 py-2 flex-shrink-0"
                >
                  Apply Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-light-bg/40 text-sm mb-4">
              Don't see a role that fits? We're always looking for talented people.
            </p>
            <Link to="/support" className="btn-secondary">
              Send Us Your Resume
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
