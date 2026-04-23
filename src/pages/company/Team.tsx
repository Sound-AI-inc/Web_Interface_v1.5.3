import SectionHeading from "../../components/SectionHeading";
import { Linkedin, Twitter } from "lucide-react";

const team = [
  {
    name: "Alex Volkov",
    role: "CEO & Co-Founder",
    bio: "Former audio ML lead at a major streaming platform. 10+ years in music technology and AI research.",
    tags: ["AI Strategy", "Music Tech", "Product"],
  },
  {
    name: "Maya Chen",
    role: "CTO & Co-Founder",
    bio: "Deep learning researcher specializing in generative audio models. PhD in Computer Science from MIT.",
    tags: ["Audio ML", "Architecture", "Research"],
  },
  {
    name: "James Okonkwo",
    role: "VP of Engineering",
    bio: "Built scalable audio processing pipelines at two unicorn startups. Expert in real-time systems.",
    tags: ["Infrastructure", "Backend", "DevOps"],
  },
  {
    name: "Sarah Kim",
    role: "Head of Product",
    bio: "Former product lead at a leading DAW company. Deep understanding of producer workflows.",
    tags: ["Product Design", "UX", "DAW Workflows"],
  },
  {
    name: "David Ruiz",
    role: "Head of Business Development",
    bio: "15 years in music industry partnerships. Connected across labels, publishers, and tech platforms.",
    tags: ["Partnerships", "Music Industry", "Strategy"],
  },
  {
    name: "Dr. Lena Hartmann",
    role: "AI Research Advisor",
    bio: "Professor of Audio Signal Processing. Pioneered several key architectures in neural audio synthesis.",
    tags: ["Research", "Neural Audio", "Advisory"],
  },
];

export default function Team() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Our Team"
            title="Music Meets Machine Learning"
            subtitle="A team of music technologists, AI researchers, and industry veterans building the future of audio production."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="card group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-pink/20 to-accent-cyan/20 flex items-center justify-center mb-4">
                  <span className="font-poppins font-bold text-lg gradient-text">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <h3 className="font-poppins font-semibold text-lg">{member.name}</h3>
                <p className="text-accent-pink text-sm font-medium mb-3">{member.role}</p>
                <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed mb-4">{member.bio}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-light-bg/40 border border-gray-200 dark:border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <a href="#" className="text-gray-300 dark:text-light-bg/30 hover:text-accent-cyan transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href="#" className="text-gray-300 dark:text-light-bg/30 hover:text-accent-cyan transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
