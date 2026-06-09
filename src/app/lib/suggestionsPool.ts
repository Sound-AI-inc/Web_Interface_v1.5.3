export interface SuggestionItem {
  id: string;
  prompt: string;
  type: "Audio Sample" | "MIDI" | "VST Preset";
}

const AUDIO_SEEDS = [
  "Generate dark techno kick with sub tail",
  "Create layered trap hi-hat loop",
  "Generate ambient cinematic texture",
  "Design punchy boom-bap drum loop at 90 BPM",
  "Create vinyl crackle lo-fi texture layer",
  "Generate deep house bass groove in F minor",
  "Build aggressive dubstep growl one-shot",
  "Create warm Rhodes chord stab with tape saturation",
  "Generate 808 trap sub with long decay",
  "Design cinematic riser with white noise sweep",
  "Create jazz brush drum pattern, swing feel",
  "Generate acid 303 bass sequence loop",
  "Build ethereal vocal chop pad texture",
  "Create punchy snare with room ambience",
  "Generate modular synth arp loop, 128 BPM",
  "Design halftime DnB break with ghost snares",
  "Create granular pad swell for film scoring",
  "Generate UK garage shuffled percussion loop",
  "Build distorted guitar power chord riff",
  "Create underwater pluck texture with chorus",
];

const MIDI_SEEDS = [
  "Generate MIDI chord progression in D minor, 90 BPM",
  "Design melodic house pluck MIDI pattern",
  "Create soulful neo-soul chord voicings in E major",
  "Generate trap melody line with slides and bends",
  "Build arpeggiated synth lead in A minor, 4 bars",
  "Create jazz piano comping pattern, medium swing",
  "Design techno acid bass MIDI sequence",
  "Generate emotional piano ballad progression",
  "Create funk guitar chord stabs MIDI pattern",
  "Build cinematic string ostinato in C minor",
  "Generate drill-style dark melody, 140 BPM",
  "Create lofi hip-hop piano loop with ghost notes",
  "Design progressive trance supersaw lead line",
  "Generate gospel organ chord walk in G major",
  "Build minimal techno rolling bass MIDI pattern",
  "Create bossa nova guitar voicing progression",
  "Generate synthwave bass arp in E minor",
  "Design ambient piano motif with sparse voicings",
  "Create reggaeton dembow MIDI melody hook",
  "Build orchestral brass fanfare phrase",
];

const PRESET_SEEDS = [
  "Design serum bass preset, aggressive mid-range",
  "Create analog synth stab preset",
  "Build warm analog pad with slow filter movement",
  "Design pluck preset for melodic house arps",
  "Create distorted lead preset for techno solos",
  "Generate lush reverb piano preset for ballads",
  "Build tight 808 sub bass preset with punch",
  "Design brass stab preset, cinematic trailer style",
  "Create wobble bass preset for dubstep drops",
  "Generate glassy FM bell preset for ambient",
  "Build supersaw lead preset with wide stereo",
  "Design vintage Rhodes electric piano preset",
  "Create gritty tape-saturated mono lead",
  "Build evolving shimmer pad with slow LFO",
  "Design metallic percussion pluck for IDM",
  "Create resonant acid squelch bass preset",
  "Generate airy vocal formant pad preset",
  "Build punchy FM electric piano for funk",
  "Design detuned saw stack for big room leads",
  "Create dark ambient drone preset with noise layer",
];

const AUDIO_MODIFIERS = [
  "",
  "with sidechain pump",
  "at 120 BPM",
  "in stereo width",
  "with tape warmth",
  "for club mix",
  "with tight low-end",
  "with airy top-end",
];

const MIDI_MODIFIERS = [
  "",
  "in 4/4 time",
  "with swing groove",
  "over 8 bars",
  "with passing tones",
  "for drop section",
  "with octave doubles",
  "in Dorian mode",
];

const PRESET_MODIFIERS = [
  "",
  "for Serum",
  "with slow attack",
  "with bright filter",
  "for live performance",
  "mono compatible",
  "with chorus depth",
  "for hook writing",
];

function expandSeeds(
  seeds: string[],
  modifiers: string[],
  type: SuggestionItem["type"],
  prefix: string,
  target = 80,
): SuggestionItem[] {
  const items: SuggestionItem[] = [];
  for (let i = 0; i < target; i++) {
    const seed = seeds[i % seeds.length];
    const mod = modifiers[Math.floor(i / seeds.length) % modifiers.length];
    const prompt = mod ? `${seed} ${mod}`.trim() : seed;
    items.push({ id: `${prefix}${i + 1}`, prompt, type });
  }
  return items;
}

export const SUGGESTIONS_POOL: SuggestionItem[] = [
  ...expandSeeds(AUDIO_SEEDS, AUDIO_MODIFIERS, "Audio Sample", "a"),
  ...expandSeeds(MIDI_SEEDS, MIDI_MODIFIERS, "MIDI", "m"),
  ...expandSeeds(PRESET_SEEDS, PRESET_MODIFIERS, "VST Preset", "p"),
];

export function pickSuggestions(seed: number, count = 3): SuggestionItem[] {
  const audio = SUGGESTIONS_POOL.filter((s) => s.type === "Audio Sample");
  const midi = SUGGESTIONS_POOL.filter((s) => s.type === "MIDI");
  const preset = SUGGESTIONS_POOL.filter((s) => s.type === "VST Preset");
  if (count <= 3) {
    return [
      audio[seed % audio.length],
      midi[(seed + 1) % midi.length],
      preset[(seed + 2) % preset.length],
    ];
  }
  const picks: SuggestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const bucket = i % 3 === 0 ? audio : i % 3 === 1 ? midi : preset;
    picks.push(bucket[(seed + i) % bucket.length]);
  }
  return picks;
}
