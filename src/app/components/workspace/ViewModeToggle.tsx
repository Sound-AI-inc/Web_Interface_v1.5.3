import { LayoutGrid, List } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { ViewMode } from "../../state/promptsStore";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const { t } = useLanguage();
  return (
    <div className="inline-flex rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 font-codec text-[11px] font-semibold ${
          value === "grid" ? "bg-primary text-on-accent" : "text-[var(--text-secondary)]"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {t("view.grid")}
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 font-codec text-[11px] font-semibold ${
          value === "list" ? "bg-primary text-on-accent" : "text-[var(--text-secondary)]"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        {t("view.list")}
      </button>
    </div>
  );
}
