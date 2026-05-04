import { ArrowUp, LoaderCircle } from "lucide-react";

interface GenerateButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  mode?: "pro" | "lite";
}

export default function GenerateButton({
  onClick,
  disabled,
  label = "Generate",
  loading = false,
  mode = "pro",
}: GenerateButtonProps) {
  const palette =
    mode === "lite"
      ? "bg-[linear-gradient(135deg,#a1e7ee,#b9edf1,#ff98a8)] shadow-[0_16px_36px_rgba(161,231,238,0.28)] text-[#18323a]"
      : "bg-[linear-gradient(135deg,#ff3c82,#ff6d93,#ff98a8)] shadow-[0_16px_36px_rgba(255,60,130,0.26)] text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-12 min-w-[152px] items-center justify-center gap-2 rounded-full px-5 font-poppins text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80 ${palette}`}
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
