import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, SkipForward, X } from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

export type TourTarget = {
  id: string;
  title: string;
  description: string;
};

export type TourStep = TourTarget & {
  target: string;
};

export type ProductTourStep =
  | "create"
  | "prompts"
  | "editor"
  | "library"
  | "export"
  | "integrations"
  | "credits"
  | "interface-mode";

export interface ProductTourStepDef {
  key: ProductTourStep;
  target: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: ProductTourStepDef[] = [
  {
    key: "create",
    target: "[data-tour='create']",
    title: "Create",
    description: "Generate production-ready Audio Samples, MIDI and VST Presets from here.",
  },
  {
    key: "prompts",
    target: "[data-tour='prompts']",
    title: "Prompts",
    description: "Save, organize and reuse your generation ideas.",
  },
  {
    key: "editor",
    target: "[data-tour='editor']",
    title: "Editor Mode",
    description: "Refine and work with generated assets.",
  },
  {
    key: "library",
    target: "[data-tour='library']",
    title: "Library",
    description: "Keep your generated assets organized and accessible.",
  },
  {
    key: "export",
    target: "[data-tour='export']",
    title: "Export",
    description: "Send your assets into your production workflow.",
  },
  {
    key: "integrations",
    target: "[data-tour='integrations']",
    title: "Integrations",
    description: "Connect SoundAI with your production environment.",
  },
  {
    key: "credits",
    target: "[data-tour='credits']",
    title: "Credits",
    description: "Your generation balance is shown here.",
  },
  {
    key: "interface-mode",
    target: "[data-tour='interface-mode']",
    title: "Lite / Pro",
    description: "Switch between available SoundAI production modes.",
  },
];

const FIRST_RUN_SEEN_KEY = "soundai:tour-seen";

export function hasSeenProductTour(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(FIRST_RUN_SEEN_KEY) === "1";
}

export function markProductTourSeen() {
  localStorage.setItem(FIRST_RUN_SEEN_KEY, "1");
}

export function resetProductTour() {
  localStorage.removeItem(FIRST_RUN_SEEN_KEY);
}

interface InteractiveProductTourProps {
  open: boolean;
  onClose: () => void;
}

function getTargetElement(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function measureTarget(element: Element | null): { top: number; left: number; width: number; height: number } | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function Spotlight({ target, isPro }: { target: { top: number; left: number; width: number; height: number }; isPro: boolean }) {
  const { top, left, width, height } = target;
  const holeSize = 4;
  const overlayFill = isPro
    ? "rgba(0, 0, 0, 0.55)"
    : "rgba(0, 0, 0, 0.4)";
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={{ overflow: "visible" }}
    >
      <rect
        x={left - holeSize}
        y={top - holeSize}
        width={width + holeSize * 2}
        height={height + holeSize * 2}
        rx={8}
        className={isPro ? "shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" : "shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"}
        fill={overlayFill}
      />
    </svg>
  );
}

export default function InteractiveProductTour({ open, onClose }: InteractiveProductTourProps) {
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [notFoundCount, setNotFoundCount] = useState(0);

  const currentStep = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let attempts = 0;

    const poll = () => {
      const el = getTargetElement(currentStep.target);
      const rect = measureTarget(el);
      if (rect && !cancelled) {
        setTargetRect(rect);
        setNotFoundCount(0);
      } else if (!cancelled) {
        setTargetRect(null);
        attempts++;
        if (attempts > 25) {
          setNotFoundCount((n) => n + 1);
          attempts = 0;
        }
      }
      if (cancelled) return;
      setTimeout(poll, 120);
    };
    poll();

    const handleResize = () => {
      const el = getTargetElement(currentStep.target);
      const rect = measureTarget(el);
      if (rect) setTargetRect(rect);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [open, currentStep.target]);

  const finishTour = useCallback(async (status: "completed" | "skipped") => {
    if (isFinishing) return;
    setIsFinishing(true);
    markProductTourSeen();
    console.info(`[onboarding] Product tour ${status}`);
    setIsFinishing(false);
    onClose();
  }, [isFinishing, onClose]);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const goNext = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      void finishTour("completed");
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finishTour]);

  useEffect(() => {
    if (!open) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        void finishTour("skipped");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open, finishTour, goNext]);

  if (!open) return null;

  const tooltipLeft = targetRect
    ? Math.min(targetRect.left + targetRect.width / 2, window.innerWidth - 320)
    : window.innerWidth / 2 - 160;
  const tooltipTop = targetRect
    ? Math.min(targetRect.top + targetRect.height + 24, window.innerHeight - 240)
    : 40;

  return createPortal(
    <>
      {(targetRect || (notFoundCount > 0 && notFoundCount < 3)) && targetRect && (
        <Spotlight target={targetRect} isPro={isPro} />
      )}
      <div
        className="fixed z-[9999] w-[360px] max-w-[calc(100vw-48px)] rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 shadow-[var(--ui-shadow-floating)]"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          animation: "popover-in 0.2s ease-out",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Tour step {step + 1} of {TOUR_STEPS.length}
            </div>
            <h2 className="font-syne text-[20px] font-bold text-[var(--text-primary)]">{currentStep.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => void finishTour("skipped")}
            className="rounded-full border border-[var(--border-primary)] p-2 text-[var(--text-muted)] transition-colors hover:text-primary"
            aria-label="Close product tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 font-codec text-sm leading-6 text-[var(--text-secondary)]">{currentStep.description}</p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0 || isFinishing}
            className="premium-asset-action h-10 px-4 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={() => void finishTour("skipped")}
            disabled={isFinishing}
            className="premium-asset-action h-10 px-4"
          >
            <SkipForward className="h-4 w-4" />
            Skip tour
          </button>
          <button
            type="button"
            disabled={isFinishing}
            onClick={goNext}
            className="app-btn-primary h-10 px-5 disabled:opacity-50"
          >
            {step >= TOUR_STEPS.length - 1 ? "Start creating" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
