import { useEffect, useRef } from "react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Minimal reusable confirmation dialog for destructive workspace actions.
 * Replaces blocking window.confirm(). Non-blocking, Escape-aware,
 * returns focus to the invoking element.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { mode } = useInterfaceMode();
  const themeClass = mode === "lite" ? "theme-lite" : "theme-pro";
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      data-theme={mode}
      className={`${themeClass} fixed inset-0 z-[550] flex items-center justify-center p-6`}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        className="shell-modal-backdrop absolute inset-0"
        onClick={onCancel}
      />
      <div className="shell-modal-panel relative w-full max-w-sm rounded-[20px] p-6">
        <h2 className="font-poppins text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 font-codec text-[13px] leading-6 text-[var(--text-secondary)]">{body}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="app-btn-ghost h-9 px-4 text-xs">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`h-9 ${danger ? "app-btn-danger" : "app-btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
