import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, SkipForward, Sparkles, X } from "lucide-react";
import { markGuidedTour } from "../lib/onboardingService";

const TOUR_STEPS = [
  { title: "Workspace", copy: "Start from your main workspace and keep your projects organized in one place." },
  { title: "Projects", copy: "Create and switch between projects without losing your current creative context." },
  { title: "Library", copy: "Browse samples, presets, and saved assets from the unified library view." },
  { title: "Generation", copy: "Launch new generations from the create flow and explore your ideas quickly." },
  { title: "Assets", copy: "Review generated audio, MIDI, and presets inside your asset pipeline." },
  { title: "Credits", copy: "Track your available credits so every generation stays visible and predictable." },
  { title: "Billing", copy: "Manage plan changes, upgrades, and account billing from a single place." },
  { title: "Export", copy: "Send finished items to your preferred format and workflow when ready." },
  { title: "Settings", copy: "Adjust preferences, profiles, and product behavior from settings." },
  { title: "Profile", copy: "Keep your account identity and preferences aligned across the workspace." },
] as const;

interface GuidedTourModalProps {
  open: boolean;
  userId?: string;
  onClose: () => void;
}

export default function GuidedTourModal({ open, userId, onClose }: GuidedTourModalProps) {
  const [step, setStep] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const current = TOUR_STEPS[step];
  const progress = useMemo(() => ((step + 1) / TOUR_STEPS.length) * 100, [step]);

  if (!open) return null;

  const finishTour = async (status: "completed" | "skipped") => {
    if (!userId) {
      onClose();
      return;
    }

    setIsFinishing(true);
    await markGuidedTour(userId, status);
    setIsFinishing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-[560px] rounded-[24px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6 shadow-[var(--ui-shadow-floating)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Guided tour
            </div>
            <h2 className="font-syne text-[24px] font-bold text-[var(--text-primary)]">Welcome to SoundAI</h2>
          </div>
          <button type="button" onClick={() => void finishTour("skipped")} className="rounded-full border border-[var(--border-primary)] p-2 text-[var(--text-muted)] transition-colors hover:text-primary" aria-label="Close guided tour">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-5">
          <p className="font-codec text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Step {step + 1} of {TOUR_STEPS.length}</p>
          <h3 className="mt-2 font-syne text-[22px] font-bold text-[var(--text-primary)]">{current.title}</h3>
          <p className="mt-2 font-codec text-sm leading-6 text-[var(--text-secondary)]">{current.copy}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
              className="premium-asset-action h-10 px-4 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => void finishTour("skipped")}
              className="premium-asset-action h-10 px-4"
            >
              <SkipForward className="h-4 w-4" />
              Skip tutorial
            </button>
          </div>

          <button
            type="button"
            disabled={isFinishing}
            onClick={() => {
              if (step >= TOUR_STEPS.length - 1) {
                void finishTour("completed");
                return;
              }
              setStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
            }}
            className="app-btn-primary h-10 px-5 disabled:opacity-50"
          >
            {step >= TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
