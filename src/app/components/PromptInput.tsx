import type { ReactNode } from "react";
import { Mic } from "lucide-react";
import GenerateButton from "./GenerateButton";

interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  generateLabel?: string;
  modeLabel?: string;
  mode?: "pro" | "lite";
  controls?: ReactNode;
  onAdd?: () => void;
  intelligenceHint?: string;
  activityChips?: ReactNode;
  layout?: "hero" | "dock";
}

export default function PromptInput({
  value,
  onChange,
  onGenerate,
  placeholder,
  disabled = false,
  loading = false,
  generateLabel,
  modeLabel = "Create",
  mode = "pro",
  controls,
  onAdd,
  intelligenceHint,
  activityChips,
  layout = "hero",
}: PromptInputProps) {
  const modeShell = "ui-premium-border";
  const modeBadge =
    mode === "lite"
      ? "border-[rgba(161,231,238,0.38)] bg-[rgba(161,231,238,0.18)] text-[#2f6a71]"
      : "border-[rgba(255,60,130,0.2)] bg-[rgba(255,60,130,0.12)] text-[#c22b64]";
  const isHero = layout === "hero";

  return (
    <div
      className={`prompt-shell ui-surface-3 overflow-visible rounded-[34px] transition-colors focus-within:border-primary/45 ${modeShell} ${
        isHero ? "px-5 py-5 md:px-7 md:py-6" : "px-4 py-4 md:px-5 md:py-4"
      }`}
    >
      <div className="relative z-[1]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`${isHero ? "text-base" : "text-sm"} font-medium text-text/78`}>
              {isHero ? "Chat to make music" : "Continue the generation"}
            </div>
            <div className="mt-1 text-[12px] font-codec text-text/48">
              Prompt once and shape results by format, model, and output mode.
            </div>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${modeBadge}`}
          >
            {modeLabel}
          </div>
        </div>

        {activityChips && isHero && <div className="mb-3 flex flex-wrap gap-2">{activityChips}</div>}

        <div
          className="ui-prompt-pulse"
          data-active={value.trim().length > 0 || loading ? "true" : "false"}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={isHero ? 4 : 2}
            placeholder={placeholder ?? "Describe the mood, instruments, texture and output you want..."}
            className={`w-full resize-none bg-transparent px-1 py-1 font-codec text-[15px] leading-7 text-text placeholder:text-text/38 focus:outline-none disabled:cursor-not-allowed disabled:text-text/60 ${
              isHero ? "min-h-[124px]" : "min-h-[72px]"
            }`}
          />
        </div>

        <div
          className="ui-compute-line relative mt-2 overflow-hidden rounded-full px-1 py-1 font-codec text-[11px] text-text/50"
          data-active={value.trim().length > 0 || loading ? "true" : "false"}
        >
          {intelligenceHint ??
            "Prompt interpreter idle. Add musical intent, arrangement cues, or timbral language to activate live orchestration."}
        </div>

        <div className={`mt-4 ${isHero ? "space-y-3" : "space-y-2.5"}`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">{controls}</div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAdd?.()}
              className="ui-surface-1 ui-interactive flex h-12 w-12 items-center justify-center rounded-full text-text/65 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add audio or components"
            >
              <span className="text-2xl leading-none">+</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Voice prompt"
                disabled={disabled}
                className="ui-surface-1 ui-interactive flex h-12 w-12 items-center justify-center rounded-full text-text/65 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mic className="h-4 w-4" />
              </button>
              <GenerateButton
                onClick={onGenerate}
                disabled={disabled}
                loading={loading}
                label={generateLabel ?? "Create"}
                mode={mode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
