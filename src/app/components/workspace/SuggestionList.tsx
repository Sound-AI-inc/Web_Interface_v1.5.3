import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";

interface Suggestion {
  id: string;
  prompt: string;
  type: "Audio Sample" | "MIDI" | "VST Preset";
}

const POOL: Suggestion[] = [
  { id: "a1", prompt: "Generate dark techno kick with sub tail", type: "Audio Sample" },
  { id: "a2", prompt: "Create layered trap hi-hat loop", type: "Audio Sample" },
  { id: "a3", prompt: "Generate ambient cinematic texture", type: "Audio Sample" },
  { id: "m1", prompt: "Generate MIDI chord progression in D minor, 90 BPM", type: "MIDI" },
  { id: "m2", prompt: "Design melodic house pluck MIDI pattern", type: "MIDI" },
  { id: "p1", prompt: "Design serum bass preset, aggressive mid-range", type: "VST Preset" },
  { id: "p2", prompt: "Create analog synth stab preset", type: "VST Preset" },
];

function pickSet(seed: number): Suggestion[] {
  const audio = POOL.filter((s) => s.type === "Audio Sample");
  const midi = POOL.filter((s) => s.type === "MIDI");
  const preset = POOL.filter((s) => s.type === "VST Preset");
  const ai = (seed + 1) % audio.length;
  const mi = (seed + 2) % midi.length;
  const pi = (seed + 3) % preset.length;
  return [audio[ai], midi[mi], preset[pi]];
}

interface SuggestionListProps {
  onSelect: (suggestion: Suggestion) => void;
}

export default function SuggestionList({ onSelect }: SuggestionListProps) {
  const { t } = useLanguage();
  const [seed, setSeed] = useState(0);
  const suggestions = useMemo(() => pickSet(seed), [seed]);

  return (
    <div className="w-full text-left">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-codec text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
          {t("workspace.suggestions")}
        </span>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="composer-control inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-codec text-[11px] font-semibold"
        >
          <Shuffle className="h-3 w-3" />
          {t("workspace.shuffle")}
        </button>
      </div>
      <ul className="space-y-1.5">
        {suggestions.map((s) => (
          <li key={`${seed}-${s.id}`}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex w-full items-start gap-2 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              <span className="min-w-0 flex-1">
                <span className="block font-codec text-[13px] text-[var(--text-primary)]">{s.prompt}</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                  {s.type}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { Suggestion };
