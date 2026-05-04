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
}: PromptInputProps) {
  return (
    <div className="prompt-shell rounded-[30px] border border-white/55 bg-[linear-gradient(180deg,rgba(64,35,18,0.88),rgba(52,29,16,0.92))] px-4 py-4 shadow-[0_24px_80px_rgba(62,27,11,0.22)] transition-colors focus-within:border-primary/45 md:px-6 md:py-5">
      <div className="relative z-[1]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-white/76">Chat to make music</div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/52">
            {modeLabel}
          </div>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={placeholder ?? "Describe the mood, instruments, texture and output you want..."}
          className="min-h-[96px] w-full resize-none bg-transparent px-1 py-1 font-codec text-[15px] leading-7 text-white placeholder:text-white/38 focus:outline-none disabled:cursor-not-allowed disabled:text-white/60"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/76 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Add prompt context"
            >
              <span className="text-2xl leading-none">+</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              className="rounded-full border border-white/10 bg-white/6 px-4 py-3 font-poppins text-sm font-medium text-white/76 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Advanced
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Voice prompt"
              disabled={disabled}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/76 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
            </button>
            <GenerateButton
              onClick={onGenerate}
              disabled={disabled}
              loading={loading}
              label={generateLabel ?? "Create"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
