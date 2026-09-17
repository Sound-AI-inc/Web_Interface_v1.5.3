import { useMemo, useState } from "react";
import { KeyboardMusic, Music2, Shuffle, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { pickSuggestions, type SuggestionItem } from "../../lib/suggestionsPool";

interface SuggestionListProps {
  onSelect: (suggestion: SuggestionItem) => void;
}

function typeIcon(type: SuggestionItem["type"]) {
  if (type === "MIDI") return KeyboardMusic;
  if (type === "VST Preset") return SlidersHorizontal;
  return Music2;
}

/** Derive a compact card title from a prompt seed ("Generate dark techno
 *  kick with sub tail" → "Dark techno kick with sub tail"). */
export function suggestionTitle(prompt: string): string {
  const stripped = prompt.replace(/^(generate|create|design|build)\s+/i, "").trim();
  const titled = stripped.charAt(0).toUpperCase() + stripped.slice(1);
  return titled.length > 52 ? `${titled.slice(0, 51)}…` : titled;
}

export default function SuggestionList({ onSelect }: SuggestionListProps) {
  const { t } = useLanguage();
  const [seed, setSeed] = useState(0);
  const suggestions = useMemo(() => pickSuggestions(seed, 3), [seed]);

  return (
    <div className="w-full text-left">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-codec text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {t("workspace.suggestions")}
        </span>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          aria-label={t("workspace.shuffle")}
          className="composer-control inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-codec text-[11px] font-semibold"
        >
          <Shuffle className="h-3 w-3" />
          {t("workspace.shuffle")}
        </button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {suggestions.map((s) => {
          const Icon = typeIcon(s.type);
          return (
            <li key={`${seed}-${s.id}`}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                title={s.prompt}
                className="recommendation-card group flex h-full w-full flex-col gap-2 p-3 text-left"
              >
                <span className="flex items-center gap-1.5 font-codec text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {s.type}
                </span>
                <span className="line-clamp-2 min-h-[2.4em] font-codec text-[13px] font-medium leading-5 text-[var(--text-primary)]">
                  {suggestionTitle(s.prompt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export type { SuggestionItem as Suggestion };
