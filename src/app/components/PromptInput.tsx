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
}: PromptInputProps) {
  const modeShell =
    mode === "lite"
      ? "border-[rgba(161,231,238,0.42)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,243,246,0.88))] shadow-[0_26px_80px_rgba(161,231,238,0.18)]"
      : "border-[rgba(255,152,168,0.42)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,240,244,0.9))] shadow-[0_26px_80px_rgba(255,60,130,0.16)]";
  const modeBadge =
    mode === "lite"
      ? "border-[rgba(161,231,238,0.38)] bg-[rgba(161,231,238,0.18)] text-[#2f6a71]"
      : "border-[rgba(255,60,130,0.2)] bg-[rgba(255,60,130,0.12)] text-[#c22b64]";
  return (
    <div className={`prompt-shell overflow-visible rounded-[34px] border px-4 py-4 transition-colors focus-within:border-primary/45 md:px-6 md:py-5 ${modeShell}`}>
      <div className="relative z-[1]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-text/72">Describe your next sound</div>
            <div className="mt-1 text-[12px] font-codec text-text/46">
              Prompt once and shape results by format, model, and output mode.
            </div>
          </div>
          <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${modeBadge}`}>
            {modeLabel}
          </div>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={placeholder ?? "Describe the mood, instruments, texture and output you want..."}
          className="min-h-[96px] w-full resize-none bg-transparent px-1 py-1 font-codec text-[15px] leading-7 text-text placeholder:text-text/38 focus:outline-none disabled:cursor-not-allowed disabled:text-text/60"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAdd?.()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/8 bg-white/75 text-text/65 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add audio or components"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
            {controls}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Voice prompt"
              disabled={disabled}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/8 bg-white/75 text-text/65 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
