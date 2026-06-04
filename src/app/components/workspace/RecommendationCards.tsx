import { KeyboardMusic, Music2, SlidersHorizontal, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Recommendation {
  id: string;
  title: string;
  type: string;
  category: string;
  prompt: string;
  icon: LucideIcon;
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "techno-kick",
    title: "Dark Techno Kick",
    type: "Audio Sample",
    category: "Drums",
    prompt: "Dark techno kick with sub tail and punchy transient",
    icon: Music2,
  },
  {
    id: "ambient-texture",
    title: "Ambient Texture",
    type: "Audio Sample",
    category: "Atmosphere",
    prompt: "Ambient cinematic texture for intro, 8 bars, wide stereo",
    icon: Sparkles,
  },
  {
    id: "serum-bass",
    title: "Serum Bass",
    type: "VST Preset",
    category: "Bass",
    prompt: "Serum bass preset, aggressive mid-range, mono sub",
    icon: SlidersHorizontal,
  },
  {
    id: "chord-progression",
    title: "Chord Progression",
    type: "MIDI",
    category: "Harmony",
    prompt: "MIDI chord progression in D minor, 90 BPM, 4 bars",
    icon: KeyboardMusic,
  },
];

interface RecommendationCardsProps {
  onSelect: (rec: Recommendation) => void;
}

export default function RecommendationCards({ onSelect }: RecommendationCardsProps) {
  return (
    <div className="w-full max-w-[720px]">
      <div className="mb-3 font-codec text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        Recommended
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {RECOMMENDATIONS.map((rec) => {
          const Icon = rec.icon;
          return (
            <button
              key={rec.id}
              type="button"
              onClick={() => onSelect(rec)}
              className="recommendation-card group text-left"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-primary transition-colors group-hover:border-primary/40">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-codec text-[14px] font-semibold text-[var(--text-primary)]">
                    {rec.title}
                  </div>
                  <div className="mt-1 font-codec text-[12px] text-[var(--text-secondary)]">
                    {rec.type}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
                    {rec.category}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
