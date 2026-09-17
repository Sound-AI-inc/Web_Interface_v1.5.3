import { useEffect, useRef, type ReactNode } from "react";
import { Paperclip } from "lucide-react";
import GenerateButton from "./GenerateButton";
import VoiceCaptureButton from "./VoiceCaptureButton";
import { useLanguage } from "../i18n/LanguageProvider";

interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  generateLabel?: string;
  mode?: "pro" | "lite";
  controls?: ReactNode;
  layout?: "hero" | "dock";
  textareaId?: string;
}

export default function PromptInput({
  value,
  onChange,
  onGenerate,
  onAttach,
  placeholder = "Describe the mood, instruments, texture and output you want...",
  disabled = false,
  loading = false,
  generateLabel = "Create",
  mode = "pro",
  controls,
  layout = "hero",
  textareaId = "generator-composer-input",
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(112, textarea.scrollHeight)}px`;
  }, [value]);

  const isDock = layout === "dock";

  return (
    <div
      className={`composer-shell rounded-[20px] ${
        isDock ? "rounded-b-none px-3 py-3 md:px-5 md:py-3" : "px-5 py-5 md:px-6 md:py-5"
      }`}
    >
      <div className="relative z-[1]">
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          aria-label="Describe the sound you want to generate"
          onKeyDown={(e) => {
            // UX-018/019: Enter sends (guarded by the in-flight lock in the
            // caller, so Enter spam or click+Enter cannot double-submit).
            if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as KeyboardEvent).isComposing) {
              e.preventDefault();
              if (!disabled && !loading) onGenerate();
            }
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
          }}
          className="composer-field w-full resize-none bg-transparent px-1 py-0.5 font-codec text-[14px] leading-6 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="mt-2.5 flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 lg:flex-wrap lg:overflow-visible">
            {controls}
            {onAttach && (
              <button
                type="button"
                onClick={onAttach}
                disabled={disabled}
                className="composer-icon-btn h-9 w-9 rounded-button text-[var(--text-secondary)] hover:text-primary hover:bg-[var(--surface-secondary)] transition-colors"
                aria-label={t("composer.attach")}
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <VoiceCaptureButton
              disabled={disabled}
              onTranscript={(text) => onChange(value ? `${value} ${text}` : text)}
            />
            <GenerateButton
              onClick={onGenerate}
              disabled={disabled}
              loading={loading}
              label={generateLabel}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
