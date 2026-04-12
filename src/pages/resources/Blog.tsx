import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import { Clock, ArrowRight, Tag } from "lucide-react";

const categories = ["All", "AI & Music Production", "Workflow Tutorials", "Creator Economy", "Product Updates", "Research"];

const posts = [
  {
    title: "Why Modular AI Beats Full-Track Generation",
    category: "AI & Music Production",
    date: "Mar 15, 2026",
    readTime: "6 min read",
    excerpt: "Full-track AI generation faces legal, creative, and workflow challenges. Here's why modular asset generation is the future of AI-assisted music production.",
  },
  {
    title: "Getting Started: Your First AI-Generated Sample Pack",
    category: "Workflow Tutorials",
    date: "Mar 10, 2026",
    readTime: "8 min read",
    excerpt: "A step-by-step guide to generating your first audio samples, MIDI patterns, and VST presets using SoundAI's natural language interface.",
  },
  {
    title: "The State of AI in the Creator Economy",
    category: "Creator Economy",
    date: "Mar 5, 2026",
    readTime: "10 min read",
    excerpt: "How AI tools are reshaping independent music production and what it means for creators, labels, and platforms.",
  },
  {
    title: "SoundAI Beta Launch: What's New",
    category: "Product Updates",
    date: "Feb 28, 2026",
    readTime: "4 min read",
    excerpt: "Introducing our public beta with text-to-audio generation, MIDI synthesis, VST preset creation, and DAW-native export.",
  },
  {
    title: "Neural Audio Synthesis: A Technical Overview",
    category: "Research",
    date: "Feb 20, 2026",
    readTime: "12 min read",
    excerpt: "A deep dive into the architecture behind SoundAI's multi-modal generation pipeline — from text embeddings to audio waveforms.",
  },
  {
    title: "Integrating AI Samples into Your Ableton Workflow",
    category: "Workflow Tutorials",
    date: "Feb 15, 2026",
    readTime: "7 min read",
    excerpt: "Practical tips for incorporating AI-generated assets into your existing Ableton Live projects without disrupting your creative flow.",
  },
];

export default function Blog() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 -right-32 w-96 h-96 bg-accent-pink/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Blog"
            title="Insights & Updates"
            subtitle="Explore the latest in AI music production, creator workflows, and product updates."
          />

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  i === 0
                    ? "bg-accent-pink text-white"
                    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-light-bg/50 hover:text-gray-900 dark:text-light-bg hover:bg-gray-100 dark:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.title} className="card group flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3 h-3 text-accent-pink" />
                  <span className="text-xs text-accent-pink font-medium">{post.category}</span>
                </div>
                <h3 className="font-poppins font-semibold text-lg mb-2 group-hover:text-accent-pink transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-300 dark:text-light-bg/30">
                    <Clock className="w-3 h-3" />
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <Link to="#" className="text-accent-pink text-xs font-semibold flex items-center gap-1">
                    Read <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
