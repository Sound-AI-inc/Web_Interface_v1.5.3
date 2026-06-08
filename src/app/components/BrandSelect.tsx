import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

export default function BrandSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  className = "",
  menuClassName = "",
}: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [openUpward, setOpenUpward] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const normalized = options.map(normalize);
  const current = normalized.find((o) => o.value === value);

  const updatePosition = () => {
    const trigger = wrapRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = Math.min(288, normalized.length * 36 + 12);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const upward = spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;
    setOpenUpward(upward);
    const measured = menuRef.current?.getBoundingClientRect().height ?? estimatedHeight;
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      top: upward ? rect.top - measured - 6 : rect.bottom + 6,
      zIndex: "var(--z-dropdown)",
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const menu = menuRef.current;
    if (menu) {
      const measured = menu.getBoundingClientRect().height;
      const rect = wrapRef.current!.getBoundingClientRect();
      if (openUpward) {
        setMenuStyle((prev) => ({ ...prev, top: rect.top - measured - 6 }));
      }
    }
  }, [open, normalized.length, openUpward]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = open
    ? createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          className={`token-menu max-h-72 overflow-auto rounded-[12px] p-1 shadow-[var(--ui-shadow-floating)] ${menuClassName}`}
          style={menuStyle}
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
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
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
        </ul>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-open={open ? "true" : "false"}
        className={`composer-control flex h-8 w-full items-center justify-between gap-2 px-3 font-codec text-[12px] focus:outline-none focus:ring-0 ${
          open ? "border-[var(--border-secondary)]" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>
      {menu}
    </div>
  );
}
