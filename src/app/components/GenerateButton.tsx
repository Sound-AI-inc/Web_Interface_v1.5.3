import { ArrowUp, LoaderCircle } from "lucide-react";

interface GenerateButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  loading?: boolean;
}

export default function GenerateButton({
  onClick,
  disabled,
  label = "Generate",
  loading = false,
}: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex h-12 min-w-[152px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff5e6e,#ff7b57,#ff9448)] px-5 font-poppins text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,106,92,0.26)] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {label}
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowUp className="h-4 w-4" />
      )}
    </button>
  );
}
