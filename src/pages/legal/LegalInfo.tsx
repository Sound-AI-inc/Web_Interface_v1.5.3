import SectionHeading from "../../components/SectionHeading";
import { Building2, Globe, Shield, AlertTriangle } from "lucide-react";

export default function LegalInfo() {
  return (
    <section className="section-padding">
      <div className="container-max max-w-4xl">
        <SectionHeading
          badge="Legal"
          title="Legal Information"
          subtitle="Corporate structure and compliance information."
        />

        <div className="space-y-6">
          {/* Corporate Structure */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-accent-pink" />
              <h3 className="font-poppins font-semibold text-lg">Corporate Structure</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 dark:text-light-bg/40 mb-1">Legal Entity</p>
                <p className="text-gray-600 dark:text-light-bg/70">SoundAI Inc.</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-light-bg/40 mb-1">Incorporation</p>
                <p className="text-gray-600 dark:text-light-bg/70">State of Delaware, United States</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-light-bg/40 mb-1">Type</p>
                <p className="text-gray-600 dark:text-light-bg/70">C-Corporation</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-light-bg/40 mb-1">Contact</p>
                <p className="text-gray-600 dark:text-light-bg/70">legal@soundai.studio</p>
              </div>
            </div>
          </div>

          {/* Regulatory */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-accent-cyan" />
              <h3 className="font-poppins font-semibold text-lg">Regulatory Compliance</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-500 dark:text-light-bg/50 leading-relaxed">
              <p>
                SoundAI complies with applicable data protection regulations including the General Data
                Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
              </p>
              <p>
                Our platform is designed with privacy-by-design principles and implements appropriate
                technical and organizational measures to protect user data.
              </p>
              <p>
                For data protection inquiries, contact our Data Protection Officer at privacy@soundai.studio.
              </p>
            </div>
          </div>

          {/* IP */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-accent-pink" />
              <h3 className="font-poppins font-semibold text-lg">Intellectual Property</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-500 dark:text-light-bg/50 leading-relaxed">
              <p>
                SoundAI's trademarks, logos, and brand assets are protected under applicable trademark laws.
                Use of SoundAI's brand assets requires prior written approval.
              </p>
              <p>
                SoundAI's AI models, generation technology, and platform architecture are proprietary and
                protected by trade secret and intellectual property laws.
              </p>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="card border-yellow-400/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="font-poppins font-semibold text-lg">Disclaimers</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-500 dark:text-light-bg/50 leading-relaxed">
              <p>
                SoundAI does not make claims regarding regulatory approval of its AI models or generated
                content in any specific jurisdiction. Users are responsible for ensuring compliance with
                local laws and regulations.
              </p>
              <p>
                This website and the information contained herein do not constitute financial advice,
                investment recommendations, or offers to sell securities. All market data and projections
                referenced are based on third-party sources and may not reflect current conditions.
              </p>
              <p>
                SoundAI makes no guarantees regarding the commercial viability, fitness for a particular
                purpose, or non-infringement of generated assets. The Service is provided "as is" subject
                to the Terms of Use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
