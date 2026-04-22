import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface BrandSelectOption {
  value: string;
  label?: string;
}

interface BrandSelectProps {
  value: string;
  options: (string | BrandSelectOption)[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  menuClassName?: string;
}

function normalize(o: string | BrandSelectOption): BrandSelectOption {
  if (typeof o === "string") return { value: o, label: o };
  return { value: o.value, label: o.label ?? o.value };
}

/**
 * Branded, accessible dropdown that mirrors the visual language of the rest
 * of the dashboard (Codec Pro, primary accent, soft hover, flat shadow).
 * Not a full ARIA listbox — keyboard navigation is intentionally minimal
 * (Enter / Escape + click), which is fine for short option lists.
 */
export default function BrandSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  className = "",
  menuClassName = "",
}: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const normalized = options.map(normalize);
  const current = normalized.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-input border bg-white px-3 font-codec text-xs text-text transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          open ? "border-primary/60" : "border-surface"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text/50 transition-transform ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className={`absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-card border border-surface bg-white p-1 shadow-lg ${menuClassName}`}
        >
          {normalized.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-button px-2.5 py-1.5 text-left font-codec text-xs transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-text/80 hover:bg-surface-muted"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {active && <Check className="h-3 w-3 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
