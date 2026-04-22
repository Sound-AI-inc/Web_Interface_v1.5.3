import { ArrowUp } from "lucide-react";

interface GenerateButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

export default function GenerateButton({ onClick, disabled, label = "Generate" }: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="app-btn-primary h-10 px-4"
    >
      {label}
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
