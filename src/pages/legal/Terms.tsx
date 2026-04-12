import SectionHeading from "../../components/SectionHeading";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using SoundAI's platform, website, API, or any related services (collectively, the \"Service\"), you agree to be bound by these Terms of Use. If you do not agree, you may not use the Service. SoundAI reserves the right to update these terms at any time with notice provided through the platform.",
  },
  {
    title: "2. Account Registration",
    content: "To access certain features, you must create an account. You are responsible for maintaining the security of your account credentials and for all activity under your account. You must provide accurate, current information and promptly update it if it changes.",
  },
  {
    title: "3. Permitted Use",
    content: "The Service is intended for lawful music production, audio generation, and related creative and development purposes. You may use generated assets in commercial and non-commercial projects. You may not use the Service to generate content that infringes third-party rights, violates applicable laws, or is harmful, misleading, or objectionable.",
  },
  {
    title: "4. Generated Asset Ownership",
    content: "Subject to compliance with these Terms, you retain ownership and usage rights to assets generated through your account. SoundAI does not claim ownership of your generated assets. However, SoundAI retains rights to the underlying models, technology, and platform infrastructure.",
  },
  {
    title: "5. API Usage",
    content: "API access is subject to rate limits, usage quotas, and the applicable pricing plan. You may not share API keys, exceed authorized usage, reverse-engineer the API, or use it in a manner that degrades service for other users.",
  },
  {
    title: "6. Subscription & Billing",
    content: "Paid plans are billed on a recurring basis. You authorize SoundAI to charge your payment method at the start of each billing cycle. Cancellations take effect at the end of the current billing period. Refunds are handled on a case-by-case basis in accordance with applicable law.",
  },
  {
    title: "7. Intellectual Property",
    content: "SoundAI's platform, models, branding, documentation, and technology are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works of SoundAI's proprietary materials without explicit written permission.",
  },
  {
    title: "8. Limitation of Liability",
    content: "To the maximum extent permitted by law, SoundAI shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. SoundAI's total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.",
  },
  {
    title: "9. Termination",
    content: "SoundAI may suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason with reasonable notice. Upon termination, your right to use the Service ceases immediately, though generated assets previously downloaded remain yours.",
  },
  {
    title: "10. Governing Law",
    content: "These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in accordance with applicable rules.",
  },
];

export default function Terms() {
  return (
    <section className="section-padding">
      <div className="container-max max-w-4xl">
        <SectionHeading badge="Legal" title="Terms of Use" />
        <p className="text-gray-400 dark:text-light-bg/40 text-sm mb-8 text-center">
          Last updated: March 1, 2026
        </p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="font-poppins font-semibold text-lg mb-3">{s.title}</h3>
              <p className="text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
