import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 3600;

function borderClass(kind: ToastKind): string {
  if (kind === "error") return "border-[var(--error)]/40";
  if (kind === "success") return "border-[var(--success)]/40";
  return "border-[var(--border-primary)]";
}

function dotVar(kind: ToastKind): string {
  if (kind === "error") return "var(--error)";
  if (kind === "success") return "var(--success)";
  return "var(--accent-primary)";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const notify = useCallback((message: string, kind: ToastKind = "info") => {
    const trimmed = message.trim();
    if (!trimmed) return;
    seq.current += 1;
    const id = seq.current;
    setItems((prev) => [...prev.slice(-3), { id, message: trimmed, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, DISMISS_MS);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[600] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`premium-toast feed-enter pointer-events-auto flex w-full items-center gap-2.5 rounded-[14px] border px-4 py-3 font-codec text-[13px] leading-5 ${borderClass(item.kind)}`}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: dotVar(item.kind) }}
            />
            <span className="min-w-0 flex-1 text-[var(--text-primary)]">{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Safe outside a provider (e.g. auxiliary public routes rendered outside
 * AppLayout): returns a console-backed no-op instead of throwing.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return useMemo(
    () =>
      ctx ?? {
        notify: (message: string) => {
          if (message.trim()) console.info("[toast]", message);
        },
      },
    [ctx],
  );
}
