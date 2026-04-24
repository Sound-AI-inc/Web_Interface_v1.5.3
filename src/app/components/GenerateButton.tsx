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
      className="app-btn-primary h-10 min-w-[136px] px-4 disabled:cursor-not-allowed disabled:opacity-80"
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
