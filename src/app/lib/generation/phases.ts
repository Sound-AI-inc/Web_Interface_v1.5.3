import type { GenerationStatus } from "../../types/generation";

/**
 * P4-A — Generator state machine vocabulary. The UI maps its existing flow
 * onto these phases instead of scattering boolean flags:
 * idle → validating → generating → processing → completed | preview | failed,
 * with cancelled reachable while a request is in flight.
 */
export type { GenerationStatus };

export const GENERATION_PHASE_LABELS: Record<GenerationStatus, string> = {
  idle: "Idle",
  validating: "Checking your request…",
  queued: "Queued…",
  generating: "Generating…",
  processing: "Finalizing assets…",
  completed: "Completed",
  failed: "Generation failed",
  cancelled: "Cancelled",
  preview: "Preview",
};
