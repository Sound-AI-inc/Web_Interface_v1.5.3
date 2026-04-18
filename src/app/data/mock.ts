export type AudioType = "Audio Sample" | "MIDI Melody" | "VST Preset";
export type ModelName = "SoundCraft v1" | "MidiCraft" | "SoundCraft";
export type OutputFormat = "WAV Audio" | "MP3 Audio" | "FLAC" | "OGG";

export type ResultKind = "audio" | "midi" | "preset";

export interface MidiNoteLite {
  pitch: number; // midi number
  start: number; // seconds
  duration: number; // seconds
  velocity?: number; // 0..1
}

export interface PresetGlance {
  oscillator: "sine" | "triangle" | "sawtooth" | "square" | "fmsine" | "amsine";
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterCutoff: number; // Hz
  filterResonance: number;
}

export interface AudioResult {
  id: string;
  title: string;
  model: string;
  kind: ResultKind;
  durationSeconds: number;
  format: string;
  description: string;
  tags: string[];
  // For audio previews: a seed that drives a deterministic synthetic waveform.
  audioSeed?: number;
  // For MIDI previews: a sequence of notes played back on a sampled piano.
  notes?: MidiNoteLite[];
  // For VST preset previews: the preset parameters used to drive a Tone synth.
  preset?: PresetGlance;
  // Optional visual hue for legacy thumbs.
  waveformHue?: string;
}

export const audioResults: AudioResult[] = [
  {
    id: "r1",
    title: "Summer Lo-fi Sketch",
    model: "SoundCraft v1.5",
    kind: "audio",
    durationSeconds: 6,
    format: "MP3",
    description: "Dusty keys, tape wobble, gentle brush drums.",
    tags: ["lofi", "chill"],
    audioSeed: 1,
    waveformHue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]",
  },
  {
    id: "r2",
    title: "Rainy Day Melody",
    model: "MidiCraft",
    kind: "midi",
    durationSeconds: 6,
    format: "MID",
    description: "8-bar melodic sketch in A minor for acoustic piano.",
    tags: ["piano", "melody"],
    notes: [
      { pitch: 69, start: 0.0, duration: 0.45 },
      { pitch: 72, start: 0.5, duration: 0.45 },
      { pitch: 76, start: 1.0, duration: 0.45 },
      { pitch: 74, start: 1.5, duration: 0.45 },
      { pitch: 72, start: 2.0, duration: 0.45 },
      { pitch: 69, start: 2.5, duration: 0.45 },
      { pitch: 67, start: 3.0, duration: 0.95 },
      { pitch: 69, start: 4.0, duration: 0.45 },
      { pitch: 72, start: 4.5, duration: 0.45 },
      { pitch: 76, start: 5.0, duration: 0.95 },
    ],
  },
  {
    id: "r3",
    title: "Warm Rhodes Preset",
    model: "SoundCraft",
    kind: "preset",
    durationSeconds: 4,
    format: "FXP",
    description: "Lush Rhodes-style preset. Slow attack, gentle filter sweep.",
    tags: ["keys", "rhodes"],
    preset: {
      oscillator: "fmsine",
      attack: 0.02,
      decay: 0.3,
      sustain: 0.6,
      release: 1.2,
      filterCutoff: 1800,
      filterResonance: 0.6,
    },
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
  kind: ResultKind;
  format: string;
  duration?: string;
  durationSeconds: number;
  tags: string[];
  createdAt: string;
  audioSeed?: number;
  notes?: MidiNoteLite[];
  preset?: PresetGlance;
  waveformHue?: string;
}

export const library: LibraryAsset[] = [
  {
    id: "l1",
    title: "Summer Lo-fi Sketch",
    kind: "audio",
    format: "WAV",
    duration: "0:06",
    durationSeconds: 6,
    tags: ["lofi", "chill"],
    createdAt: "Apr 14",
    audioSeed: 1,
    waveformHue: "from-[#3b1a6b] via-[#ff3c82] to-[#ff98a8]",
  },
  {
    id: "l2",
    title: "Punchy Synthwave Lead",
    kind: "midi",
    format: "MID",
    durationSeconds: 6,
    tags: ["synthwave", "lead"],
    createdAt: "Apr 12",
    notes: [
      { pitch: 66, start: 0, duration: 0.25 },
      { pitch: 73, start: 0.25, duration: 0.25 },
      { pitch: 70, start: 0.5, duration: 0.25 },
      { pitch: 73, start: 0.75, duration: 0.25 },
      { pitch: 78, start: 1.0, duration: 0.5 },
      { pitch: 75, start: 1.5, duration: 0.5 },
      { pitch: 73, start: 2.0, duration: 0.5 },
      { pitch: 70, start: 2.5, duration: 0.5 },
      { pitch: 66, start: 3.0, duration: 1.0 },
    ],
  },
  {
    id: "l3",
    title: "Warm Rhodes Preset",
    kind: "preset",
    format: "FXP",
    durationSeconds: 4,
    tags: ["keys", "rhodes"],
    createdAt: "Apr 10",
    preset: {
      oscillator: "fmsine",
      attack: 0.02,
      decay: 0.3,
      sustain: 0.6,
      release: 1.2,
      filterCutoff: 1800,
      filterResonance: 0.6,
    },
  },
  {
    id: "l4",
    title: "Cinematic Tension Bed",
    kind: "audio",
    format: "WAV",
    duration: "0:12",
    durationSeconds: 12,
    tags: ["cinematic", "pad"],
    createdAt: "Apr 08",
    audioSeed: 4,
    waveformHue: "from-[#1e1e2a] via-[#ff3c82] to-[#a1e7ee]",
  },
  {
    id: "l5",
    title: "Boom-bap Drum Loop",
    kind: "audio",
    format: "WAV",
    duration: "0:08",
    durationSeconds: 8,
    tags: ["drums", "hiphop"],
    createdAt: "Apr 05",
    audioSeed: 5,
    waveformHue: "from-[#5b3a29] via-[#ff6a00] to-[#ffb86b]",
  },
  {
    id: "l6",
    title: "Acid 303 MIDI",
    kind: "midi",
    format: "MID",
    durationSeconds: 4,
    tags: ["acid", "bass"],
    createdAt: "Apr 02",
    notes: [
      { pitch: 45, start: 0.0, duration: 0.2 },
      { pitch: 45, start: 0.25, duration: 0.15 },
      { pitch: 48, start: 0.5, duration: 0.15 },
      { pitch: 50, start: 0.75, duration: 0.15 },
      { pitch: 45, start: 1.0, duration: 0.2 },
      { pitch: 52, start: 1.25, duration: 0.2 },
      { pitch: 55, start: 1.5, duration: 0.2 },
      { pitch: 45, start: 2.0, duration: 0.4 },
      { pitch: 48, start: 2.5, duration: 0.4 },
      { pitch: 45, start: 3.0, duration: 0.8 },
    ],
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
    description: "Send generated audio and MIDI directly to an open Ableton set.",
    connected: true,
    iconLetter: "A",
  },
  {
    id: "fl",
    name: "FL Studio",
    category: "DAW",
    description: "Drop stems and patterns into FL Studio's playlist.",
    connected: false,
    iconLetter: "F",
  },
  {
    id: "logic",
    name: "Logic Pro",
    category: "DAW",
    description: "Bounce directly to a Logic project session.",
    connected: false,
    iconLetter: "L",
  },
  {
    id: "wav",
    name: "WAV / MP3 / FLAC",
    category: "Format",
    description: "Multi-format export pipeline — lossless and lossy options.",
    connected: true,
    iconLetter: "W",
  },
  {
    id: "midi",
    name: "MIDI 2.0",
    category: "Format",
    description: "High-resolution MIDI export for modern DAWs.",
    connected: true,
    iconLetter: "M",
  },
  {
    id: "api",
    name: "SoundAI API",
    category: "API",
    description: "Generate programmatically from your own services.",
    connected: false,
    soon: true,
    iconLetter: "{ }",
  },
];

export interface CreditPackage {
  credits: number;
  price: number;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  extras: string[];
  highlight?: boolean;
  cta: string;
  creditPackages?: CreditPackage[];
  pricingNote?: string;
}

export const plans: Plan[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    cadence: "/7 days",
    description:
      "Get started with 20 free credits for 7 days. Try AI sound generation and explore the Sound Library.",
    features: [
      "20 free credits",
      "Basic audio generation",
      "MP3 exports",
      "Community support",
    ],
    extras: [
      "🌐 Access to Basic Prompt Templates",
      "🎛️ AI Sound Preview Mode (3–5 sec)",
      "🧠 Limited Smart Prompt Suggestions",
      "🔄 Auto-Save Drafts",
    ],
    cta: "Subscribe Now",
  },
  {
    id: "standard",
    name: "Standard",
    price: "$7",
    cadence: "/one-time",
    description:
      "Perfect for new creators. Includes 30 credits, advanced audio generation, WAV exports, and basic library access.",
    features: [
      "30 generation credits",
      "Advanced audio editing",
      "WAV exports",
      "Basic sound library access",
      "Email support",
    ],
    extras: [
      "🎚️ AI Mixing Assistant (Lite)",
      "🎧 Loop Integration Mode",
      "📦 Download History Access",
      "⚙️ Prompt-to-Preset Conversion (beta)",
      "🔍 Searchable Sound Library by Tags",
      "💾 Cloud Storage (up to 500 MB)",
    ],
    highlight: true,
    cta: "Subscribe Now",
  },
  {
    id: "premium",
    name: "Premium Flex",
    price: "$30",
    cadence: "/from",
    description: "Flexible plan — pay only for the credits you need.",
    features: [
      "Advanced AI editing & plugins",
      "All formats (WAV, MIDI, MP3)",
      "Access to full sound library",
      "Priority support",
      "Commercial usage rights",
    ],
    extras: [
      "🧠 AI Mastering Suite",
      "🎼 MIDI-to-Sound AI Conversion",
      "🧩 DAW Plugin Integration (VST/AU)",
      "🔄 Stem Separation & Remixing",
      "🎙️ Voice-to-Instrument AI",
      "📈 Priority GPU Queue",
      "☁️ Extended Cloud Storage (up to 10 GB)",
      "🛠️ Early Access to Beta Features",
      "🧩 Custom Model Training (by request)",
      "🔐 Private Project Mode",
      "📊 Sound Usage Analytics",
      "🤝 Collaborative Sessions",
      "🎯 Adaptive AI Model Selection",
    ],
    creditPackages: [
      { credits: 30, price: 30 },
      { credits: 100, price: 85 },
      { credits: 500, price: 380 },
      { credits: 1000, price: 700 },
      { credits: 3000, price: 1800 },
    ],
    pricingNote: "Prices adjust dynamically based on selected credits.",
    cta: "Subscribe Now",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "pricing",
    description:
      "AI infrastructure for studios, labels, and enterprise partners. Scalable. Secure. Customizable.",
    features: [
      "Dedicated AI cluster / private GPU node",
      "Custom model deployment & training",
      "Multi-user licensing & RBAC",
      "Enterprise-grade security (SOC 2 / GDPR / ISO 27001)",
    ],
    extras: [
      "⚙️ Dedicated AI Cluster / Private GPU Node",
      "🚀 Custom Model Deployment",
      "🧩 Multi-User License Management",
      "💼 Role-Based Access Control (RBAC)",
      "🌍 Regional Data Hosting (EU/US/APAC)",
      "🎚️ AI Stem Mixer Pro",
      "🎼 Multi-Track AI Generation",
      "🎙️ Voice Synthesis Suite",
      "🔄 Batch Audio Generation API",
      "🎛️ Custom Plugin SDK",
      "🧩 Cross-App Integration",
      "🔐 End-to-End Encryption (AES-256)",
      "🧱 Private Environment Sandbox",
      "📜 GDPR / SOC 2 / ISO 27001 Compliance",
      "🕵️ Audit Log & Usage Tracking",
      "🚫 No Public Model Training",
      "🤝 Team Collaboration Hub",
      "🗂️ Project Version Control",
      "🕓 Real-Time Co-Editing",
      "🔄 Integration with Notion, Slack, Jira",
      "📦 Shared Asset Library",
      "🧑‍💻 Dedicated Account Manager",
      "⏱️ Priority SLA (99.9% uptime)",
      "📞 24/7 Tech Support",
      "🎓 Onboarding & Training Sessions",
      "🧩 Custom Roadmap Collaboration",
      "📊 Advanced Sound Analytics Dashboard",
      "🧠 Usage Prediction Models",
      "💡 Trend Intelligence Feed",
      "🧩 White-Label Interface (add-on)",
      "🎧 Custom Voice/Instrument Model Training (add-on)",
      "💬 Private API Endpoint (add-on)",
      "🌐 Multi-Language Voice Pack (add-on)",
    ],
    cta: "Contact sales",
  },
];

export interface UsageMetric {
  label: string;
  used: number;
  total: number;
}

export const usageMetrics: UsageMetric[] = [
  { label: "Generations this month", used: 87, total: 300 },
  { label: "Storage", used: 2.4, total: 10 },
  { label: "API calls", used: 512, total: 2000 },
];
