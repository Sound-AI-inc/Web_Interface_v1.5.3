import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

export default function ShellModal({
  open,
  onClose,
  children,
  widthClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClassName: string;
}) {
  const { mode } = useInterfaceMode();
  const themeClass = mode === "lite" ? "theme-lite" : "theme-pro";

  if (!open) return null;

  return createPortal(
    <div
      data-theme={mode}
      className={`shell-modal-root ${themeClass} fixed inset-0`}
      style={{ zIndex: "var(--z-modal)" }}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="shell-modal-backdrop absolute inset-0"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-6">
        <div
          className={`shell-modal-panel pointer-events-auto relative max-h-[88vh] w-full overflow-hidden ${widthClassName}`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-floating)] text-[var(--text-secondary)] transition-colors hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="token-scroll max-h-[88vh] overflow-y-auto rounded-[24px] p-2">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
