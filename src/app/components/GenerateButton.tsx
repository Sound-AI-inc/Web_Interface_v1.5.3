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
      ? "bg-[linear-gradient(135deg,#38bdf8_0%,#7dd3fc_60%,#bae6fd_100%)] shadow-[0_2px_16px_rgba(56,189,248,0.30)] text-[#0f0f12]"
      : "bg-[linear-gradient(135deg,#ff3b6b_0%,#ff6b9d_60%,#ff9cc0_100%)] shadow-[0_0_32px_rgba(255,59,107,0.20)] text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`ui-cta-glow inline-flex h-11 min-w-[126px] items-center justify-center gap-2 rounded-full border border-white/10 px-5 font-codec text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-80 ${palette}`}
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
