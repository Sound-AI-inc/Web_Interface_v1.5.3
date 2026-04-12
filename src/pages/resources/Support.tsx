import SectionHeading from "../../components/SectionHeading";
import {
  BookOpen,
  CreditCard,
  Download,
  Puzzle,
  AlertCircle,
  MessageSquare,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const helpTopics = [
  { icon: BookOpen, title: "Getting Started", desc: "Account setup, first generation, and platform overview." },
  { icon: CreditCard, title: "Billing", desc: "Subscription plans, payment methods, invoices, and credits." },
  { icon: Download, title: "Export Issues", desc: "Troubleshooting DAW export, format compatibility, and downloads." },
  { icon: Puzzle, title: "Plugin Integration", desc: "VST/AU plugin setup, DAW configuration, and compatibility." },
  { icon: AlertCircle, title: "Troubleshooting", desc: "Common issues, error codes, and resolution steps." },
  { icon: MessageSquare, title: "Contact Form", desc: "Reach our support team for any question or issue." },
];

export default function Support() {
  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute top-0 -left-32 w-96 h-96 bg-accent-pink/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="Support"
            title="Help Center"
            subtitle="Find answers, troubleshoot issues, or contact our support team."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {helpTopics.map((topic) => (
              <Link key={topic.title} to="#" className="card group hover:border-accent-pink/20">
                <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center mb-4 group-hover:bg-accent-pink/20 transition-colors">
                  <topic.icon className="w-5 h-5 text-accent-pink" />
                </div>
                <h3 className="font-poppins font-semibold mb-1 group-hover:text-accent-pink transition-colors">
                  {topic.title}
                </h3>
                <p className="text-gray-500 dark:text-light-bg/50 text-sm">{topic.desc}</p>
              </Link>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-accent-pink" />
                <h3 className="font-poppins font-bold text-xl">Submit a Support Request</h3>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-light-bg/60 mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full bg-gray-50 dark:bg-dark-deeper/60 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-light-bg placeholder:text-gray-300 dark:text-light-bg/30 focus:outline-none focus:border-accent-pink/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-light-bg/60 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-gray-50 dark:bg-dark-deeper/60 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-light-bg placeholder:text-gray-300 dark:text-light-bg/30 focus:outline-none focus:border-accent-pink/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-light-bg/60 mb-1.5">Category</label>
                  <select className="w-full bg-gray-50 dark:bg-dark-deeper/60 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-500 dark:text-light-bg/60 focus:outline-none focus:border-accent-pink/50">
                    <option>Getting Started</option>
                    <option>Billing</option>
                    <option>Export Issues</option>
                    <option>Plugin Integration</option>
                    <option>Troubleshooting</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-light-bg/60 mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    placeholder="Describe your issue or question..."
                    className="w-full bg-gray-50 dark:bg-dark-deeper/60 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-light-bg placeholder:text-gray-300 dark:text-light-bg/30 focus:outline-none focus:border-accent-pink/50 resize-none"
                  />
                </div>
                <button className="btn-primary w-full py-3">
                  Submit Request <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
