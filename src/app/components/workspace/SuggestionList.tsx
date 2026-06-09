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
  { id: "a4", prompt: "Design punchy boom-bap drum loop at 90 BPM", type: "Audio Sample" },
  { id: "a5", prompt: "Create vinyl crackle lo-fi texture layer", type: "Audio Sample" },
  { id: "a6", prompt: "Generate deep house bass groove in F minor", type: "Audio Sample" },
  { id: "a7", prompt: "Build aggressive dubstep growl one-shot", type: "Audio Sample" },
  { id: "a8", prompt: "Create warm Rhodes chord stab with tape saturation", type: "Audio Sample" },
  { id: "a9", prompt: "Generate 808 trap sub with long decay", type: "Audio Sample" },
  { id: "a10", prompt: "Design cinematic riser with white noise sweep", type: "Audio Sample" },
  { id: "a11", prompt: "Create jazz brush drum pattern, swing feel", type: "Audio Sample" },
  { id: "a12", prompt: "Generate acid 303 bass sequence loop", type: "Audio Sample" },
  { id: "a13", prompt: "Build ethereal vocal chop pad texture", type: "Audio Sample" },
  { id: "a14", prompt: "Create punchy snare with room ambience", type: "Audio Sample" },
  { id: "a15", prompt: "Generate modular synth arp loop, 128 BPM", type: "Audio Sample" },
  { id: "m1", prompt: "Generate MIDI chord progression in D minor, 90 BPM", type: "MIDI" },
  { id: "m2", prompt: "Design melodic house pluck MIDI pattern", type: "MIDI" },
  { id: "m3", prompt: "Create soulful neo-soul chord voicings in E major", type: "MIDI" },
  { id: "m4", prompt: "Generate trap melody line with slides and bends", type: "MIDI" },
  { id: "m5", prompt: "Build arpeggiated synth lead in A minor, 4 bars", type: "MIDI" },
  { id: "m6", prompt: "Create jazz piano comping pattern, medium swing", type: "MIDI" },
  { id: "m7", prompt: "Design techno acid bass MIDI sequence", type: "MIDI" },
  { id: "m8", prompt: "Generate emotional piano ballad progression", type: "MIDI" },
  { id: "m9", prompt: "Create funk guitar chord stabs MIDI pattern", type: "MIDI" },
  { id: "m10", prompt: "Build cinematic string ostinato in C minor", type: "MIDI" },
  { id: "m11", prompt: "Generate drill-style dark melody, 140 BPM", type: "MIDI" },
  { id: "m12", prompt: "Create lofi hip-hop piano loop with ghost notes", type: "MIDI" },
  { id: "p1", prompt: "Design serum bass preset, aggressive mid-range", type: "VST Preset" },
  { id: "p2", prompt: "Create analog synth stab preset", type: "VST Preset" },
  { id: "p3", prompt: "Build warm analog pad with slow filter movement", type: "VST Preset" },
  { id: "p4", prompt: "Design pluck preset for melodic house arps", type: "VST Preset" },
  { id: "p5", prompt: "Create distorted lead preset for techno solos", type: "VST Preset" },
  { id: "p6", prompt: "Generate lush reverb piano preset for ballads", type: "VST Preset" },
  { id: "p7", prompt: "Build tight 808 sub bass preset with punch", type: "VST Preset" },
  { id: "p8", prompt: "Design brass stab preset, cinematic trailer style", type: "VST Preset" },
  { id: "p9", prompt: "Create wobble bass preset for dubstep drops", type: "VST Preset" },
  { id: "p10", prompt: "Generate glassy FM bell preset for ambient", type: "VST Preset" },
  { id: "p11", prompt: "Build supersaw lead preset with wide stereo", type: "VST Preset" },
  { id: "p12", prompt: "Design vintage Rhodes electric piano preset", type: "VST Preset" },
];

function pickSet(seed: number): Suggestion[] {
  const audio = POOL.filter((s) => s.type === "Audio Sample");
  const midi = POOL.filter((s) => s.type === "MIDI");
  const preset = POOL.filter((s) => s.type === "VST Preset");
  const offset = seed * 3;
  const picks: Suggestion[] = [];
  for (let i = 0; i < 4; i++) {
    picks.push(audio[(offset + i * 2) % audio.length]);
  }
  picks.push(midi[(offset + 1) % midi.length]);
  picks.push(preset[(offset + 2) % preset.length]);
  return picks;
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
      <ul className="space-y-1">
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
