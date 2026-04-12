import { Link } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import { Shield, FileText, Scale, Globe, ArrowRight } from "lucide-react";

const topics = [
  {
    icon: FileText,
    title: "Copyright Policy",
    content: "SoundAI's generation models are trained on licensed and proprietary datasets. Generated assets are designed to be original outputs that do not reproduce copyrighted works. Users are responsible for ensuring their use of generated assets complies with applicable copyright laws in their jurisdiction.",
  },
  {
    icon: Shield,
    title: "Intellectual Property",
    content: "Users retain ownership of assets generated through their accounts. SoundAI retains all rights to its underlying technology, models, platform, and brand. Users may not reverse-engineer, decompile, or attempt to extract SoundAI's models or proprietary algorithms.",
  },
  {
    icon: Scale,
    title: "Acceptable Use",
    content: "The Service may not be used to generate content that infringes third-party rights, violates laws, promotes harm, or misrepresents AI-generated content as human-created where disclosure is required by law. SoundAI reserves the right to restrict access for violations.",
  },
  {
    icon: Globe,
    title: "Jurisdictional Disclaimers",
    content: "SoundAI operates globally but is incorporated in the State of Delaware, USA. Users are responsible for compliance with local laws regarding AI-generated content, data protection, and intellectual property. Availability of features may vary by jurisdiction due to regulatory requirements.",
  },
];

export default function LegalCenter() {
  return (
    <section className="section-padding">
      <div className="container-max max-w-4xl">
        <SectionHeading
          badge="Legal"
          title="Legal Center"
          subtitle="Policies and guidelines governing the use of SoundAI's platform and technology."
        />

        <div className="space-y-6">
          {topics.map((t) => (
            <div key={t.title} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-pink/10 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-accent-pink" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">{t.title}</h3>
              </div>
              <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed">{t.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link to="/legal/terms" className="btn-secondary text-xs">
            Terms of Use <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
          <Link to="/legal/privacy" className="btn-secondary text-xs">
            Privacy Policy <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
          <Link to="/legal/licenses" className="btn-secondary text-xs">
            Licenses <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
