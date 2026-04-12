import SectionHeading from "../../components/SectionHeading";

const sections = [
  {
    title: "1. Information We Collect",
    content: "We collect information you provide directly (account registration, support requests, payment information) and information collected automatically (usage data, device information, IP addresses, cookies). We do not collect audio content you generate beyond what is necessary to deliver the Service.",
  },
  {
    title: "2. How We Use Your Information",
    content: "We use your information to provide and improve the Service, process transactions, communicate with you, ensure security, comply with legal obligations, and develop new features. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Data Sharing",
    content: "We may share information with service providers who assist in operating the platform, with your consent, or as required by law. Service providers are bound by contractual obligations to protect your data and use it only for authorized purposes.",
  },
  {
    title: "4. Data Retention",
    content: "We retain your information for as long as your account is active or as needed to provide the Service. Generated assets are retained according to your plan's storage limits. You may request deletion of your account and associated data at any time.",
  },
  {
    title: "5. Your Rights (GDPR)",
    content: "If you are located in the European Economic Area, you have the right to access, correct, delete, restrict processing of, and port your personal data. You also have the right to object to processing and to withdraw consent. To exercise these rights, contact privacy@soundai.studio.",
  },
  {
    title: "6. Your Rights (CCPA)",
    content: "If you are a California resident, you have the right to know what personal information we collect, request deletion, opt out of the sale of personal information (we do not sell your data), and not be discriminated against for exercising your rights.",
  },
  {
    title: "7. Cookies & Tracking",
    content: "We use essential cookies for platform functionality and optional analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings or our cookie consent tool. We respect Do Not Track signals.",
  },
  {
    title: "8. Security",
    content: "We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits. While we strive to protect your information, no method of transmission over the Internet is 100% secure.",
  },
  {
    title: "9. International Transfers",
    content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where applicable, to protect your data during international transfers.",
  },
  {
    title: "10. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of material changes through the platform or via email. Your continued use of the Service after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "11. Contact",
    content: "For privacy-related questions or to exercise your data rights, contact our Data Protection Officer at privacy@soundai.studio or write to: SoundAI Inc., Privacy Team, 548 Market St, San Francisco, CA 94104.",
  },
];

export default function Privacy() {
  return (
    <section className="section-padding">
      <div className="container-max max-w-4xl">
        <SectionHeading badge="Legal" title="Privacy Policy" />
        <p className="text-light-bg/40 text-sm mb-8 text-center">
          Last updated: March 1, 2026 · GDPR & CCPA Compliant
        </p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="font-poppins font-semibold text-lg mb-3">{s.title}</h3>
              <p className="text-light-bg/50 text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
