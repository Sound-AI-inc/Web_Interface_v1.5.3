export type AudioType = "Audio Sample" | "MIDI Melody" | "VST Preset";
export type ModelName = "SoundCraft v1" | "MidiCraft" | "SoundCraft";
export type OutputFormat = "WAV Audio" | "MP3 Audio" | "FLAC" | "OGG";

export interface AudioResult {
  id: string;
  title: string;
  model: string;
  durationSeconds: number;
  format: string;
  waveformHue: string;
  description: string;
}

export const audioResults: AudioResult[] = [
  {
    id: "r1",
    title: "Summer Lo-fi Sketch",
    model: "SoundCraft v1.5",
    durationSeconds: 60,
    format: "MP3",
    waveformHue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]",
    description: "Waveform visualization — preview with scrub",
  },
  {
    id: "r2",
    title: "Rainy Day Prompts Mix",
    model: "SoundCraft 1.5",
    durationSeconds: 45,
    format: "WAV",
    waveformHue: "from-[#ff6a00] via-[#ff3c82] to-[#ffb86b]",
    description: "Waveform visualization — stereo spread view",
  },
  {
    id: "r3",
    title: "Punk Energy Loop",
    model: "SoundCraft 1.5",
    durationSeconds: 30,
    format: "OGG",
    waveformHue: "from-[#0fd3b8] via-[#0891b2] to-[#a1e7ee]",
    description: "Waveform visualization — tight transient control",
  },
];

export interface PromptItem {
  id: string;
  title: string;
  body: string;
  tags: string[];
  genre: string;
  mood: string;
  useCase: string;
  updatedAt: string;
  runs: number;
}

export const prompts: PromptItem[] = [
  {
    id: "p1",
    title: "Late-night lo-fi piano",
    body: "Dusty upright piano, tape saturation, gentle brush drums, 72 BPM, 4 bars.",
    tags: ["lofi", "piano", "chill"],
    genre: "Lo-fi",
    mood: "Calm",
    useCase: "Background",
    updatedAt: "2d ago",
    runs: 14,
  },
  {
    id: "p2",
    title: "Punchy synthwave lead",
    body: "80s analog saw lead, light chorus, sidechain pump, F# minor, 112 BPM.",
    tags: ["synthwave", "lead", "retro"],
    genre: "Synthwave",
    mood: "Energetic",
    useCase: "Hook",
    updatedAt: "5d ago",
    runs: 32,
  },
  {
    id: "p3",
    title: "Cinematic tension bed",
    body: "Evolving string pad with dissonant overtones, sub drone, 60 BPM.",
    tags: ["cinematic", "pad", "dark"],
    genre: "Cinematic",
    mood: "Tense",
    useCase: "Score",
    updatedAt: "1w ago",
    runs: 8,
  },
  {
    id: "p4",
    title: "Boom-bap drum loop",
    body: "Dusty sampled kit, swung hats, fat kick, 90 BPM, 2 bars.",
    tags: ["hiphop", "drums", "boombap"],
    genre: "Hip-hop",
    mood: "Groovy",
    useCase: "Drums",
    updatedAt: "1w ago",
    runs: 21,
  },
  {
    id: "p5",
    title: "Warm Rhodes chord stabs",
    body: "Rhodes mk1, lush chorus, gentle tape wobble, Cmaj7 → Am9 → Fmaj9.",
    tags: ["keys", "rhodes", "jazz"],
    genre: "Jazz",
    mood: "Warm",
    useCase: "Chords",
    updatedAt: "2w ago",
    runs: 11,
  },
  {
    id: "p6",
    title: "Analog acid 303 riff",
    body: "TB-303 style, resonance sweep, 16th-note pattern, 128 BPM, A minor.",
    tags: ["acid", "techno", "bass"],
    genre: "Techno",
    mood: "Driving",
    useCase: "Bassline",
    updatedAt: "2w ago",
    runs: 19,
  },
];

export interface LibraryAsset {
  id: string;
  title: string;
  type: "Audio" | "MIDI" | "Preset";
  format: string;
  duration?: string;
  tags: string[];
  createdAt: string;
  waveformHue: string;
}

export const library: LibraryAsset[] = [
  {
    id: "l1",
    title: "Summer Lo-fi Sketch",
    type: "Audio",
    format: "WAV",
    duration: "0:60",
    tags: ["lofi", "chill"],
    createdAt: "Apr 14",
    waveformHue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]",
  },
  {
    id: "l2",
    title: "Punchy Synthwave Lead",
    type: "MIDI",
    format: "MID",
    tags: ["synthwave", "lead"],
    createdAt: "Apr 12",
    waveformHue: "from-[#ff6a00] via-[#ff3c82] to-[#ffb86b]",
  },
  {
    id: "l3",
    title: "Warm Rhodes Preset",
    type: "Preset",
    format: "FXP",
    tags: ["keys", "rhodes"],
    createdAt: "Apr 10",
    waveformHue: "from-[#0fd3b8] via-[#0891b2] to-[#a1e7ee]",
  },
  {
    id: "l4",
    title: "Cinematic Tension Bed",
    type: "Audio",
    format: "WAV",
    duration: "1:12",
    tags: ["cinematic", "pad"],
    createdAt: "Apr 08",
    waveformHue: "from-[#1e1e2a] via-[#ff3c82] to-[#a1e7ee]",
  },
  {
    id: "l5",
    title: "Boom-bap Drum Loop",
    type: "Audio",
    format: "WAV",
    duration: "0:08",
    tags: ["drums", "hiphop"],
    createdAt: "Apr 05",
    waveformHue: "from-[#5b3a29] via-[#ff6a00] to-[#ffb86b]",
  },
  {
    id: "l6",
    title: "Acid 303 MIDI",
    type: "MIDI",
    format: "MID",
    tags: ["acid", "bass"],
    createdAt: "Apr 02",
    waveformHue: "from-[#6e00ff] via-[#ff3c82] to-[#a1e7ee]",
  },
];

export interface Integration {
  id: string;
  name: string;
  category: "DAW" | "Format" | "API";
  description: string;
  connected: boolean;
  soon?: boolean;
  iconLetter: string;
}

export const integrations: Integration[] = [
  {
    id: "ableton",
    name: "Ableton Live",
    category: "DAW",
    description: "Drag-and-drop export to Ableton sessions.",
    connected: true,
    iconLetter: "A",
  },
  {
    id: "fl",
    name: "FL Studio",
    category: "DAW",
    description: "One-click project export with channel racks.",
    connected: false,
    iconLetter: "F",
  },
  {
    id: "logic",
    name: "Logic Pro",
    category: "DAW",
    description: "Export stems and MIDI to Logic.",
    connected: false,
    iconLetter: "L",
  },
  {
    id: "wav",
    name: "WAV / MP3 / FLAC",
    category: "Format",
    description: "Standard audio export formats.",
    connected: true,
    iconLetter: "W",
  },
  {
    id: "midi",
    name: "MIDI Export",
    category: "Format",
    description: "Portable .mid export for any DAW.",
    connected: true,
    iconLetter: "M",
  },
  {
    id: "api",
    name: "Developer API",
    category: "API",
    description: "Programmatic access to SoundAI models.",
    connected: false,
    soon: true,
    iconLetter: "{}",
  },
];

export interface Plan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  features: string[];
  highlight?: boolean;
  cta: string;
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "/ month",
    features: ["20 generations / month", "Basic models", "WAV + MP3 export", "Community support"],
    cta: "Current plan",
  },
  {
    id: "standard",
    name: "Standard",
    price: "$19",
    cadence: "/ month",
    features: ["300 generations / month", "All core models", "All export formats", "Priority queue"],
    highlight: true,
    cta: "Upgrade",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$49",
    cadence: "/ month",
    features: ["Unlimited generations", "Early-access models", "Editor Mode", "API access"],
    cta: "Upgrade",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    features: ["Dedicated models", "SSO & SCIM", "Custom SLA", "Named support"],
    cta: "Contact sales",
  },
];
