import { useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What audio formats does SoundAI support?",
    a: "SoundAI generates assets in WAV, FLAC, and MP3 for audio; standard MIDI (.mid) for patterns; FXP and VST3 Preset for synthesizer presets; and JSON for structured metadata. All formats are designed for direct import into professional DAWs.",
  },
  {
    q: "Which DAWs are compatible with SoundAI?",
    a: "SoundAI supports Ableton Live, FL Studio, Logic Pro, Pro Tools, and any DAW that accepts standard WAV, MIDI, and VST/AU preset formats. Our one-click export feature is optimized for the three major DAWs.",
  },
  {
    q: "Can I edit the generated assets?",
    a: "Absolutely. Every asset SoundAI generates is fully editable. MIDI patterns can be transposed, rearranged, and quantized. Audio samples can be sliced, processed, and layered. VST presets can have their parameters adjusted. Modular editability is a core principle of our platform.",
  },
  {
    q: "Who owns the generated assets?",
    a: "You retain full ownership and usage rights to all assets generated through your SoundAI account. Generated assets can be used in commercial releases, sync licensing, streaming distribution, and any other creative or commercial context.",
  },
  {
    q: "Does SoundAI generate full songs or complete tracks?",
    a: "No. SoundAI generates modular production assets — individual samples, MIDI patterns, VST presets, and metadata. This approach gives you more creative control, avoids legal ambiguity around full AI-generated tracks, and integrates directly into professional DAW workflows.",
  },
  {
    q: "How does SoundAI handle copyright compliance?",
    a: "SoundAI's generation models are trained on licensed and proprietary data. Every generated asset includes compliance metadata documenting its origin. Our modular approach avoids the legal complexities associated with full AI-generated songs.",
  },
  {
    q: "Is there an enterprise plan?",
    a: "Yes. Our enterprise plan includes custom model fine-tuning, dedicated infrastructure, SSO integration, volume licensing, priority support SLA, and compliance features for regulated industries. Contact our sales team for details.",
  },
  {
    q: "How does pricing work?",
    a: "SoundAI offers tiered subscription plans with monthly generation credits, a free tier for experimentation, and usage-based API pricing for developers. Visit our pricing page for current plan details and rates.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <section className="section-padding waveform-bg relative overflow-hidden">
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-max relative z-10">
          <SectionHeading
            badge="FAQ"
            title="Frequently Asked Questions"
            subtitle="Common questions about SoundAI's capabilities, formats, ownership, and compliance."
          />

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`card cursor-pointer transition-all ${
                  openIndex === i ? "border-accent-pink/20" : ""
                }`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-poppins font-semibold text-sm md:text-base">{faq.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-accent-pink flex-shrink-0 transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openIndex === i && (
                  <p className="mt-4 text-gray-500 dark:text-light-bg/50 text-sm leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
