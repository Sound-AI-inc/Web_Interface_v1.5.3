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
}

export default function PromptInput({
  value,
  onChange,
  onGenerate,
  placeholder,
  disabled = false,
  loading = false,
  generateLabel,
}: PromptInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-input border border-surface bg-white px-3 py-2 transition-colors focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? "Describe the mood, instruments and length..."}
        className="flex-1 bg-transparent px-2 py-2 font-codec text-sm text-text placeholder:text-text/40 focus:outline-none disabled:cursor-not-allowed disabled:text-text/60"
      />
      <GenerateButton
        onClick={onGenerate}
        disabled={disabled}
        loading={loading}
        label={generateLabel ?? "Generate"}
      />
      <button
        type="button"
        aria-label="Voice prompt"
        disabled={disabled}
        className="ml-1 flex h-10 w-10 items-center justify-center rounded-button border border-surface text-text/60 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mic className="h-4 w-4" />
      </button>
    </div>
  );
}
