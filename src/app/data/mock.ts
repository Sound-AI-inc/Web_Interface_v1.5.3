import {
  generatedAudioResults,
  generatedLibraryAssets,
} from "./demo-library.generated";
export type {
  AudioResult,
  AudioType,
  DemoAssetMetadata,
  DemoGenerationTemplate,
  LibraryAsset,
  MidiNoteLite,
  ModelName,
  OutputFormat,
  PresetGlance,
  ResultKind,
} from "./contracts";

export const audioResults = generatedAudioResults.map((item) => ({ ...item }));

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

export const library = generatedLibraryAssets.map((item) => ({ ...item }));

export type IntegrationCategory =
  | "DAW"
  | "AI Tools"
  | "Distribution"
  | "Samples"
  | "Storage"
  | "Processing";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  connected: boolean;
  pro?: boolean;
  iconLetter: string;
}

export const integrations: Integration[] = [
  // DAW (5)
  {
    id: "ableton",
    name: "Ableton Live",
    category: "DAW",
    description: "Export and import WAV and MIDI directly into your Ableton sessions.",
    connected: false,
    iconLetter: "A",
  },
  {
    id: "fl-studio",
    name: "FL Studio",
    category: "DAW",
    description: "Send generated samples and melodies straight into your FL Studio projects.",
    connected: false,
    iconLetter: "F",
  },
  {
    id: "logic-pro",
    name: "Logic Pro",
    category: "DAW",
    description: "Sync through file exchange and Apple Script integration with Logic sessions.",
    connected: false,
    iconLetter: "L",
  },
  {
    id: "reaper",
    name: "Reaper",
    category: "DAW",
    description: "Import audio via a ReaScript plugin integration for fast project delivery.",
    connected: false,
    iconLetter: "R",
  },
  {
    id: "bandlab",
    name: "BandLab",
    category: "DAW",
    description: "Collaborate and share projects with the online BandLab DAW.",
    connected: false,
    iconLetter: "B",
  },

  // AI Tools (5)
  {
    id: "chatgpt",
    name: "ChatGPT",
    category: "AI Tools",
    description: "AI text generation for lyrics, track descriptions, and creative content.",
    connected: false,
    pro: true,
    iconLetter: "C",
  },
  {
    id: "sora",
    name: "Sora",
    category: "AI Tools",
    description: "AI video generation from audio and text prompts.",
    connected: false,
    pro: true,
    iconLetter: "S",
  },
  {
    id: "runway",
    name: "Runway",
    category: "AI Tools",
    description: "AI video editing and generation for music videos.",
    connected: false,
    pro: true,
    iconLetter: "Rw",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    category: "AI Tools",
    description: "AI image generation for album covers and artwork.",
    connected: false,
    pro: true,
    iconLetter: "Mj",
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    category: "AI Tools",
    description: "Open-source AI image generation for creative music visuals.",
    connected: false,
    iconLetter: "SD",
  },

  // Distribution (3)
  {
    id: "soundcloud",
    name: "SoundCloud",
    category: "Distribution",
    description: "Direct track upload with automatic tag filling.",
    connected: false,
    iconLetter: "Sc",
  },
  {
    id: "landr",
    name: "LANDR",
    category: "Distribution",
    description: "API mastering and DSP distribution to all major stores.",
    connected: false,
    pro: true,
    iconLetter: "Ln",
  },
  {
    id: "audius",
    name: "Audius",
    category: "Distribution",
    description: "Decentralized Web3 track publishing.",
    connected: false,
    iconLetter: "Au",
  },

  // Samples (2)
  {
    id: "splice",
    name: "Splice",
    category: "Samples",
    description: "Automatic sample uploads to your Splice library.",
    connected: false,
    pro: true,
    iconLetter: "Sp",
  },
  {
    id: "jamahook",
    name: "Jamahook",
    category: "Samples",
    description: "AI sample suggestions and export functionality.",
    connected: false,
    iconLetter: "Jh",
  },

  // Storage (3)
  {
    id: "gdrive",
    name: "Google Drive",
    category: "Storage",
    description: "Cloud storage and backup for your audio projects and exports.",
    connected: false,
    iconLetter: "G",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Storage",
    description: "Sync and share your music projects across devices.",
    connected: false,
    iconLetter: "D",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    category: "Storage",
    description: "Microsoft cloud storage integration for projects.",
    connected: false,
    iconLetter: "O1",
  },

  // Processing (2)
  {
    id: "lalal",
    name: "LALAL.AI",
    category: "Processing",
    description: "AI-powered stem separation and track isolation.",
    connected: false,
    pro: true,
    iconLetter: "La",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    category: "Processing",
    description: "Speech-to-text and text-to-speech API for podcasts and voiceovers.",
    connected: false,
    iconLetter: "Dg",
  },
];

export interface CreditPackage {
  credits: number;
  price: number;
}

export interface PricingOption {
  id: string;
  label: string;
  price: string;
  cadence: string;
  note?: string;
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
  pricingOptions?: PricingOption[];
  proOnly?: boolean;
}

export const plans: Plan[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    cadence: "/7 days",
    description:
      "Get started with 20 free credits for 7 days. Spent credits are restored over the trial period while the subscription is active.",
    features: [
      "20 free credits",
      "Credits restore over 7 days while trial is active",
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
      "Perfect for new creators. Includes 30 credits, advanced audio generation, WAV exports, and basic library access. Credits reload with timed refills after spend events.",
    features: [
      "30 generation credits",
      "Auto-recharge 30 credits after full spend",
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
      "♻️ 30 credits auto-recharge: after full spend in 24h, after two full spend cycles in 48h.",
    ],
    highlight: true,
    pricingOptions: [
      { id: "monthly", label: "One-time", price: "$7", cadence: "/one-time" },
      {
        id: "annual",
        label: "Annual",
        price: "$84",
        cadence: "/year",
        note: "12 months of Standard — save vs. monthly top-ups.",
      },
    ],
    cta: "Subscribe Now",
  },
  {
    id: "premium",
    name: "Premium Flex",
    price: "$50",
    cadence: "/month",
    description:
      "Flexible monthly plan — starts at 50 credits/month and scales to 3000. Unlocks full Pro interface.",
    proOnly: true,
    features: [
      "50 generation credits (expandable)",
      "Pro interface unlocked",
      "Advanced AI editing & plugins",
      "All formats (WAV, MIDI, MP3, VST)",
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
      { credits: 50, price: 50 },
      { credits: 100, price: 85 },
      { credits: 500, price: 380 },
      { credits: 1000, price: 700 },
      { credits: 3000, price: 1800 },
    ],
    pricingNote:
      "Monthly subscription. Prices adjust dynamically based on selected credit package.",
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
