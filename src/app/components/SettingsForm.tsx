import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-6 border-b border-surface py-8 last:border-0 md:grid-cols-[280px_1fr]">
      <div>
        <h3 className="font-poppins text-sm font-semibold text-text">{title}</h3>
        {description && <p className="app-meta mt-1">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-codec text-xs font-medium text-text/70">{label}</span>
      {children}
      {hint && <span className="mt-1 block font-codec text-xs text-text/40">{hint}</span>}
    </label>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-card border p-4 text-left transition-colors ${
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-surface bg-white hover:border-primary/20"
      }`}
    >
      <div className="min-w-0">
        <div className="font-poppins text-sm font-medium text-text">{label}</div>
        {description && <p className="app-meta mt-0.5">{description}</p>}
      </div>
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
