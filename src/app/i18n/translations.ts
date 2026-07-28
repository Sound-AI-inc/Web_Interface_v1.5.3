/**
 * Translation dictionary for the SoundAI dashboard.
 *
 * Adding a language:
 *  1. Add an entry to `LANGUAGES` with code + label.
 *  2. Append a dictionary entry below that mirrors the `en` keys.
 *
 * Components consume translations via the `useT()` hook; missing keys fall
 * back to the English source string so partial translations still render.
 */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export type TranslationKey =
  // Navigation
  | "nav.audioGenerator"
  | "nav.prompts"
  | "nav.arrangement"
  | "nav.editor"
  | "nav.library"
  | "nav.export"
  | "nav.integrations"
  | "nav.billing"
  | "nav.profile"
  | "nav.settings"
  // Sidebar / mode
  | "sidebar.interfaceMode"
  | "sidebar.lite"
  | "sidebar.pro"
  | "sidebar.soon"
  | "sidebar.tools"
  | "header.notifications"
  | "header.lowCredits"
  | "upgrade.title"
  | "upgrade.subtitle"
  // User menu
  | "menu.settings"
  | "menu.language"
  | "menu.getHelp"
  | "menu.learnMore"
  | "menu.apiConsole"
  | "menu.aboutSoundAI"
  | "menu.tutorials"
  | "menu.courses"
  | "menu.usagePolicy"
  | "menu.privacyPolicy"
  | "menu.privacyChoices"
  | "menu.upgradePlan"
  | "menu.giftSoundAI"
  | "menu.logOut"
  // Common
  | "common.cancel"
  | "common.save"
  | "common.close"
  | "common.all"
  | "common.search"
  | "common.new"
  | "common.back"
  | "common.manage"
  // Generator
  | "generator.title"
  | "generator.subtitle"
  | "generator.credits"
  | "generator.creditsRemaining"
  | "generator.adaptivePrompt"
  | "generator.type"
  | "generator.model"
  | "generator.outputFormat"
  | "generator.import"
  | "generator.ideas"
  | "generator.smartNote"
  | "generator.liteNote"
  | "generator.results"
  | "generator.insufficientCredits"
  // Prompts
  | "prompts.title"
  | "prompts.subtitle"
  | "prompts.new"
  | "prompts.searchPlaceholder"
  | "prompts.noResults"
  | "prompts.noResultsHint"
  // Arrangement
  | "arrangement.title"
  | "arrangement.subtitle"
  // Editor
  | "editor.title"
  | "editor.subtitle"
  | "editor.audio"
  | "editor.midi"
  | "editor.synth"
  | "editor.undo"
  | "editor.redo"
  // Library
  | "library.title"
  | "library.subtitle"
  | "library.folders"
  | "library.newFolder"
  | "library.searchPlaceholder"
  | "library.moveTo"
  | "library.noAssets"
  | "library.tip"
  | "library.empty"
  // Export
  | "export.title"
  | "export.subtitle"
  | "export.selectAll"
  | "export.deselectAll"
  | "export.search"
  | "export.exportSelected"
  | "export.noFiles"
  // Integrations
  | "integrations.title"
  | "integrations.subtitle"
  // Billing
  | "billing.title"
  | "billing.subtitle"
  | "billing.currentPlan"
  | "billing.managePlan"
  | "billing.credits"
  | "billing.creditsSuffix"
  | "billing.plans"
  | "billing.comparePlans"
  | "billing.recentInvoices"
  | "billing.colDate"
  | "billing.colPlan"
  | "billing.colAmount"
  | "billing.colStatus"
  | "billing.resets"
  | "billing.popular"
  | "billing.chooseBilling"
  | "billing.selectCredits"
  | "billing.currentPlanLabel"
  // Profile
  | "profile.title"
  | "profile.subtitle"
  | "profile.saveChanges"
  | "profile.account"
  | "profile.accountDesc"
  | "profile.displayName"
  | "profile.email"
  | "profile.workspace"
  | "profile.role"
  | "profile.changeAvatar"
  | "profile.stats"
  | "profile.statsDesc"
  | "profile.generations"
  | "profile.savedPrompts"
  | "profile.libraryAssets"
  | "profile.payment"
  | "profile.paymentDesc"
  | "profile.addPayment"
  | "profile.makeDefault"
  | "profile.default"
  | "profile.notifications"
  | "profile.notificationsDesc"
  // Settings
  | "settings.title"
  | "settings.subtitle"
  | "settings.save"
  | "settings.general"
  | "settings.generalDesc"
  | "settings.workspaceName"
  | "settings.language"
  | "settings.languageDesc"
  | "settings.audioQuality"
  | "settings.audioQualityDesc"
  | "settings.sampleRate"
  | "settings.bitDepth"
  | "settings.defaultExportFormat"
  | "settings.dither"
  | "settings.ditherDesc"
  | "settings.interface"
  | "settings.interfaceDesc"
  | "settings.sidebarWidth"
  | "settings.density"
  | "settings.densityComfortable"
  | "settings.densityCompact"
  | "settings.tooltips"
  | "settings.tooltipsDesc"
  | "settings.devices"
  | "settings.devicesDesc"
  | "settings.inputDevice"
  | "settings.inputDeviceHint"
  | "settings.outputDevice"
  | "settings.export"
  | "settings.exportDesc"
  | "settings.qualityPreset"
  | "settings.qualityDraft"
  | "settings.qualityStandard"
  | "settings.qualityStudio"
  | "settings.stemsBundle"
  | "settings.stemsBundleDesc"
  | "settings.preferLossless"
  | "settings.preferLosslessDesc"
  // Workspace
  | "workspace.projects"
  | "workspace.chats"
  | "workspace.newChat"
  | "workspace.newProject"
  | "workspace.greeting"
  | "workspace.suggestions"
  | "workspace.shuffle"
  | "workspace.generations"
  | "workspace.create"
  | "workspace.generating"
  | "workspace.addToProject"
  | "workspace.assets"
  | "workspace.liveSession"
  | "workspace.recent"
  | "workspace.favorites"
  | "workspace.audioSamples"
  | "workspace.midiFiles"
  | "workspace.vstPresets"
  | "workspace.noAssets"
  | "workspace.starToSave"
  | "workspace.renameProject"
  | "workspace.noChats"
  | "workspace.noChatsInProject"
  // Context menu
  | "context.share"
  | "context.rename"
  | "context.moveToProject"
  | "context.noProject"
  | "context.removeFromProject"
  | "context.pinChat"
  | "context.pinProject"
  | "context.archive"
  | "context.archiveProject"
  | "context.delete"
  | "context.deleteChatConfirm"
  | "context.shareCopied"
  // Voice
  | "voice.start"
  | "voice.stop"
  | "voice.notSupported"
  // Notifications
  | "notifications.title"
  | "notifications.subtitle"
  // Help
  | "help.notFound"
  | "menu.supportChat"
  | "help.api.title"
  | "help.api.body"
  | "help.about.title"
  | "help.about.body"
  | "help.tutorials.title"
  | "help.tutorials.body"
  | "help.courses.title"
  | "help.courses.body"
  | "help.usage.title"
  | "help.usage.body"
  | "help.privacy.title"
  | "help.privacy.body"
  | "help.privacyChoices.title"
  | "help.privacyChoices.body"
  | "help.supportChat.title"
  | "help.supportChat.body"
  | "help.supportChat.placeholder"
  | "help.supportChat.inputPlaceholder"
  | "help.supportChat.send"
  | "help.supportChat.hero"
  | "help.supportChat.b1"
  | "help.supportChat.b2"
  | "help.supportChat.b3"
  | "help.api.hero"
  | "help.api.b1"
  | "help.api.b2"
  | "help.api.b3"
  | "help.about.hero"
  | "help.about.b1"
  | "help.about.b2"
  | "help.about.b3"
  | "help.tutorials.hero"
  | "help.tutorials.b1"
  | "help.tutorials.b2"
  | "help.tutorials.b3"
  | "help.courses.hero"
  | "help.courses.b1"
  | "help.courses.b2"
  | "help.courses.b3"
  | "help.usage.hero"
  | "help.usage.b1"
  | "help.usage.b2"
  | "help.usage.b3"
  | "help.privacy.hero"
  | "help.privacy.b1"
  | "help.privacy.b2"
  | "help.privacy.b3"
  | "help.privacyChoices.hero"
  | "help.privacyChoices.b1"
  | "help.privacyChoices.b2"
  | "help.privacyChoices.b3"
  | "help.openApp"
  | "help.contactEmail"
  // Project workspace
  | "project.notFound"
  | "project.backToCreate"
  | "project.subtitle"
  | "project.delete"
  | "project.deleteConfirm"
  | "project.openPage"
  | "project.generations"
  | "project.assetsCount"
  // View modes
  | "view.grid"
  | "view.list"
  // Onboarding
  | "onboarding.loading"
  | "onboarding.subtitle"
  | "onboarding.step"
  | "onboarding.continue"
  | "onboarding.finish"
  | "onboarding.profile.question"
  | "onboarding.profile.musicProducer"
  | "onboarding.profile.beatmaker"
  | "onboarding.profile.composer"
  | "onboarding.profile.soundDesigner"
  | "onboarding.profile.mixingEngineer"
  | "onboarding.profile.contentCreator"
  | "onboarding.profile.podcastCreator"
  | "onboarding.profile.videoCreator"
  | "onboarding.profile.gameAudio"
  | "onboarding.profile.student"
  | "onboarding.profile.other"
  | "onboarding.discovery.question"
  | "onboarding.discovery.google"
  | "onboarding.discovery.youtube"
  | "onboarding.discovery.tiktok"
  | "onboarding.discovery.instagram"
  | "onboarding.discovery.productHunt"
  | "onboarding.discovery.reddit"
  | "onboarding.discovery.friend"
  | "onboarding.discovery.discord"
  | "onboarding.discovery.newsletter"
  | "onboarding.discovery.other"
  | "onboarding.country.question"
  | "onboarding.country.unitedStates"
  | "onboarding.country.unitedKingdom"
  | "onboarding.country.canada"
  | "onboarding.country.germany"
  | "onboarding.country.france"
  | "onboarding.country.spain"
  | "onboarding.country.netherlands"
  | "onboarding.country.australia"
  | "onboarding.country.brazil"
  | "onboarding.country.other"
  | "onboarding.goal.question"
  | "onboarding.goal.audioSamples"
  | "onboarding.goal.midi"
  | "onboarding.goal.vstPresets"
  | "onboarding.goal.soundFx"
  | "onboarding.goal.musicIdeas"
  | "onboarding.goal.templates"
  | "onboarding.frequency.question"
  | "onboarding.frequency.daily"
  | "onboarding.frequency.weekly"
  | "onboarding.frequency.monthly"
  | "onboarding.frequency.occasionally"
  | "onboarding.daw.question"
  | "onboarding.daw.ableton"
  | "onboarding.daw.flStudio"
  | "onboarding.daw.logic"
  | "onboarding.daw.cubase"
  | "onboarding.daw.studioOne"
  | "onboarding.daw.reaper"
  | "onboarding.daw.proTools"
  | "onboarding.daw.other"
  | "onboarding.pain.question"
  | "onboarding.pain.soundDesign"
  | "onboarding.pain.sampleSearch"
  | "onboarding.pain.midiWriting"
  | "onboarding.pain.arrangement"
  | "onboarding.pain.mixing"
  | "onboarding.pain.presetCreation"
  | "onboarding.pain.inspiration"
  // Prompts builder
  | "prompts.templates"
  | "prompts.history"
  | "prompts.saved"
  | "prompts.gridView"
  | "prompts.listView"
  | "prompts.statsPrompts"
  | "prompts.statsRuns"
  | "prompts.statsHistory"
  | "prompts.editTitle"
  | "prompts.createTitle"
  | "prompts.editSubtitle"
  | "prompts.createSubtitle"
  | "prompts.fieldName"
  | "prompts.fieldNamePlaceholder"
  | "prompts.fieldText"
  | "prompts.fieldTextPlaceholder"
  | "prompts.addPrompt"
  | "prompts.copied"
  | "prompts.historyEmpty"
  // Settings sections
  | "settings.profile"
  | "settings.account"
  | "settings.workspace"
  | "settings.notifications"
  | "settings.security"
  | "settings.subscription"
  | "settings.creditsSection"
  | "settings.integrationsSection";

type Dict = Partial<Record<TranslationKey, string>>;

const en: Record<TranslationKey, string> = {
  "nav.audioGenerator": "Create",
  "nav.prompts": "Prompts",
  "nav.arrangement": "Arrangement",
  "nav.editor": "Editor Mode",
  "nav.library": "Library",
  "nav.export": "Export",
  "nav.integrations": "Integrations",
  "nav.billing": "Billing",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "sidebar.interfaceMode": "Interface Mode",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "sidebar.soon": "SOON",
  "sidebar.tools": "Tools",
  "header.notifications": "Notifications",
  "header.lowCredits": "Low credits — upgrade plan",
  "upgrade.title": "Upgrade Plan",
  "upgrade.subtitle": "Compare plans and unlock more generations, formats and pro workflows.",
  "menu.settings": "Settings",
  "menu.language": "Language",
  "menu.getHelp": "Get Help",
  "menu.learnMore": "Learn More",
  "menu.apiConsole": "API Console",
  "menu.aboutSoundAI": "About SoundAI",
  "menu.tutorials": "Tutorials",
  "menu.courses": "Courses",
  "menu.usagePolicy": "Usage Policy",
  "menu.privacyPolicy": "Privacy Policy",
  "menu.privacyChoices": "Your Privacy Choices",
  "menu.upgradePlan": "Upgrade Plan",
  "menu.giftSoundAI": "Gift SoundAI",
  "menu.logOut": "Log Out",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "common.all": "All",
  "common.search": "Search",
  "common.new": "New",
  "common.back": "Back",
  "common.manage": "Manage",
  "generator.title": "Create audio with AI",
  "generator.subtitle": "Audio Generator",
  "generator.credits": "Credits",
  "generator.creditsRemaining": "remaining",
  "generator.adaptivePrompt": "AdaptivePrompt",
  "generator.type": "Type",
  "generator.model": "Model",
  "generator.outputFormat": "Output Format",
  "generator.import": "Import",
  "generator.ideas": "Ideas",
  "generator.smartNote":
    "Smart suggestions adapt as you type. Type, model and output format stay in sync.",
  "generator.liteNote":
    "Lite mode: Audio Sample only · Hugging Face models · MP3 output. Switch to Pro to unlock MIDI and VST generation.",
  "generator.results": "Results",
  "generator.insufficientCredits": "Not enough credits for this generation.",
  "prompts.title": "Prompts",
  "prompts.subtitle": "Your reusable prompt library",
  "prompts.new": "New prompt",
  "prompts.searchPlaceholder": "Search prompts…",
  "prompts.noResults": "No prompts match your filters.",
  "prompts.noResultsHint": "Try clearing the search or selecting a different genre.",
  "arrangement.title": "Arrangement",
  "arrangement.subtitle": "Coming soon",
  "editor.title": "Editor Mode",
  "editor.subtitle":
    "Lightweight editing layer for generated audio, MIDI, and preset assets.",
  "editor.audio": "Audio",
  "editor.midi": "MIDI",
  "editor.synth": "Synth",
  "editor.undo": "Undo",
  "editor.redo": "Redo",
  "library.title": "Library",
  "library.subtitle": "Your generated assets, organized",
  "library.folders": "Folders",
  "library.newFolder": "New",
  "library.searchPlaceholder": "Search library…",
  "library.moveTo": "Move",
  "library.noAssets": "No assets match your filters.",
  "library.tip":
    "Tip: drag items into folders or use the move button on each card to organize assets for faster export.",
  "library.empty": "empty",
  "export.title": "Export",
  "export.subtitle": "Send library assets to your local DAW or disk",
  "export.selectAll": "Select all",
  "export.deselectAll": "Deselect all",
  "export.search": "Search files…",
  "export.exportSelected": "Export",
  "export.noFiles": "No matching files in this folder.",
  "integrations.title": "Integrations",
  "integrations.subtitle": "Connect SoundAI to the tools you already use",
  "billing.title": "Billing",
  "billing.subtitle": "Plan, usage and invoices",
  "billing.currentPlan": "Current plan",
  "billing.managePlan": "Manage plan",
  "billing.credits": "Credits this month",
  "billing.creditsSuffix": "generations",
  "billing.plans": "Plans",
  "billing.comparePlans": "Compare plans",
  "billing.recentInvoices": "Recent invoices",
  "billing.colDate": "Date",
  "billing.colPlan": "Plan",
  "billing.colAmount": "Amount",
  "billing.colStatus": "Status",
  "billing.resets": "Resets on May 14. Upgrade for more headroom.",
  "billing.popular": "Popular",
  "billing.chooseBilling": "Choose billing",
  "billing.selectCredits": "Select credits package",
  "billing.currentPlanLabel": "Current plan",
  "profile.title": "Profile",
  "profile.subtitle": "Your identity on SoundAI",
  "profile.saveChanges": "Save changes",
  "profile.account": "Account",
  "profile.accountDesc": "How you appear across SoundAI.",
  "profile.displayName": "Display name",
  "profile.email": "Email",
  "profile.workspace": "Workspace",
  "profile.role": "Role",
  "profile.changeAvatar": "Change avatar",
  "profile.stats": "Stats",
  "profile.statsDesc": "Snapshot of your recent activity.",
  "profile.generations": "Generations",
  "profile.savedPrompts": "Saved prompts",
  "profile.libraryAssets": "Library assets",
  "profile.payment": "Payment Methods",
  "profile.paymentDesc": "Cards used for subscriptions and credit packs.",
  "profile.addPayment": "Add payment method",
  "profile.makeDefault": "Make default",
  "profile.default": "Default",
  "profile.notifications": "Notifications",
  "profile.notificationsDesc": "Decide how SoundAI reaches you.",
  "settings.title": "Settings",
  "settings.subtitle": "Fine-tune your studio environment",
  "settings.save": "Save preferences",
  "settings.general": "General",
  "settings.generalDesc": "Workspace and regional defaults.",
  "settings.workspaceName": "Workspace name",
  "settings.language": "Language",
  "settings.languageDesc": "Interface language for labels, menus and dialogs.",
  "settings.audioQuality": "Audio Quality",
  "settings.audioQualityDesc": "Defaults for rendering and exports.",
  "settings.sampleRate": "Sample rate",
  "settings.bitDepth": "Bit depth",
  "settings.defaultExportFormat": "Default export format",
  "settings.dither": "Apply dither on downconversion",
  "settings.ditherDesc":
    "Reduces quantization noise when exporting at lower bit depths.",
  "settings.interface": "Interface",
  "settings.interfaceDesc": "Tune the dashboard to your workflow.",
  "settings.sidebarWidth": "Sidebar width",
  "settings.density": "Density",
  "settings.densityComfortable": "Comfortable",
  "settings.densityCompact": "Compact",
  "settings.tooltips": "Show tooltips",
  "settings.tooltipsDesc": "Inline explanations on buttons and fields.",
  "settings.devices": "Devices",
  "settings.devicesDesc": "Audio I/O for generation playback and Editor Mode.",
  "settings.inputDevice": "Input device",
  "settings.inputDeviceHint":
    "Grant microphone permission to see all connected devices.",
  "settings.outputDevice": "Output device",
  "settings.export": "Export",
  "settings.exportDesc": "Defaults when sending assets out of SoundAI.",
  "settings.qualityPreset": "Quality preset",
  "settings.qualityDraft": "Draft",
  "settings.qualityStandard": "Standard",
  "settings.qualityStudio": "Studio",
  "settings.stemsBundle": "Bundle stems when exporting",
  "settings.stemsBundleDesc":
    "Adds separated stems (drums, bass, melody) to exported projects.",
  "settings.preferLossless": "Prefer lossless formats",
  "settings.preferLosslessDesc": "Use WAV / FLAC when the target supports them.",
  "workspace.projects": "Projects",
  "workspace.chats": "Chats",
  "workspace.newChat": "New chat",
  "workspace.newProject": "New project",
  "workspace.greeting": "What would you like to create today?",
  "workspace.suggestions": "Suggestions",
  "workspace.shuffle": "Shuffle Suggestions",
  "workspace.generations": "Generations",
  "workspace.create": "Create",
  "workspace.generating": "Generating",
  "workspace.addToProject": "Add to Project",
  "workspace.assets": "Assets",
  "workspace.liveSession": "Live session",
  "workspace.recent": "Recent",
  "workspace.favorites": "Favorites",
  "workspace.audioSamples": "Audio Samples",
  "workspace.midiFiles": "MIDI Files",
  "workspace.vstPresets": "VST Presets",
  "workspace.noAssets": "No assets yet",
  "workspace.starToSave": "Star results to save",
  "workspace.renameProject": "Rename project",
  "workspace.noChats": "No chats yet — create from Create",
  "workspace.noChatsInProject": "No chats in this project yet",
  "context.share": "Share",
  "context.rename": "Rename",
  "context.moveToProject": "Move to project",
  "context.noProject": "No project (sidebar)",
  "context.removeFromProject": "Remove from project",
  "context.pinChat": "Pin chat",
  "context.pinProject": "Pin project",
  "context.archive": "Archive",
  "context.archiveProject": "Archive project",
  "context.delete": "Delete",
  "context.deleteChatConfirm": "Delete this chat and its generations?",
  "context.shareCopied": "Share link copied to clipboard.",
  "voice.start": "Voice input — hum, dictate MIDI or prompt",
  "voice.stop": "Stop recording",
  "voice.notSupported": "Voice input is not supported in this browser.",
  "notifications.title": "Notifications",
  "notifications.subtitle": "Updates about generations, billing and product news.",
  "help.notFound": "Help page not found",
  "menu.supportChat": "Support chat",
  "help.api.title": "API Console",
  "help.api.body": "Manage API keys, monitor usage and connect SoundAI to your production stack.",
  "help.api.hero": "Build with SoundAI in your stack.",
  "help.api.b1": "Create and rotate API keys securely.",
  "help.api.b2": "Track generation usage and credit spend.",
  "help.api.b3": "Connect webhooks for async renders.",
  "help.about.title": "About SoundAI",
  "help.about.body": "SoundAI helps producers generate audio samples, MIDI and VST presets with AI.",
  "help.about.hero": "AI audio production for every DAW.",
  "help.about.b1": "Generate samples, MIDI and presets from prompts.",
  "help.about.b2": "Lite and Pro workflows for every skill level.",
  "help.about.b3": "Built for producers, composers and studios.",
  "help.tutorials.title": "Tutorials",
  "help.tutorials.body": "Step-by-step guides for Create, projects, library and export workflows.",
  "help.tutorials.hero": "Learn SoundAI step by step.",
  "help.tutorials.b1": "Start with Create and voice prompts.",
  "help.tutorials.b2": "Organize work in projects and chats.",
  "help.tutorials.b3": "Export assets to your DAW.",
  "help.courses.title": "Courses",
  "help.courses.body": "Structured learning paths for sound design and AI-assisted production.",
  "help.courses.hero": "Level up your AI sound design skills.",
  "help.courses.b1": "Foundations of prompt-based music.",
  "help.courses.b2": "Advanced MIDI and preset workflows.",
  "help.courses.b3": "Studio-ready mixing with AI assets.",
  "help.usage.title": "Usage Policy",
  "help.usage.body": "Fair-use rules for generations, sharing and commercial output.",
  "help.usage.hero": "Use SoundAI responsibly.",
  "help.usage.b1": "Respect copyright and likeness rights.",
  "help.usage.b2": "Commercial use depends on your plan.",
  "help.usage.b3": "Do not abuse generation endpoints.",
  "help.privacy.title": "Privacy Policy",
  "help.privacy.body": "How SoundAI collects, stores and protects your data.",
  "help.privacy.hero": "Your data, your control.",
  "help.privacy.b1": "We store account and generation metadata securely.",
  "help.privacy.b2": "You can request export or deletion.",
  "help.privacy.b3": "We never sell personal data.",
  "help.privacyChoices.title": "Your Privacy Choices",
  "help.privacyChoices.body": "Control analytics, marketing and third-party integrations.",
  "help.privacyChoices.hero": "Choose how SoundAI uses your data.",
  "help.privacyChoices.b1": "Opt out of product analytics.",
  "help.privacyChoices.b2": "Manage marketing email preferences.",
  "help.privacyChoices.b3": "Control third-party integrations.",
  "help.supportChat.title": "Support chat",
  "help.supportChat.body": "Message our team — we typically reply within one business day.",
  "help.supportChat.hero": "We're here to help.",
  "help.supportChat.b1": "Billing, credits and plan questions.",
  "help.supportChat.b2": "Generation quality and model help.",
  "help.supportChat.b3": "Bug reports and feature requests.",
  "help.openApp": "Open SoundAI",
  "help.contactEmail": "Email support",
  "help.supportChat.placeholder": "Describe your issue or question.",
  "help.supportChat.inputPlaceholder": "Type your message…",
  "help.supportChat.send": "Send message",
  "project.notFound": "Project not found",
  "project.backToCreate": "Back to Create",
  "project.subtitle": "Generation chats in this project",
  "project.delete": "Delete project",
  "project.deleteConfirm": "Delete this project and all its chats?",
  "project.openPage": "Open project page",
  "project.generations": "generations",
  "project.assetsCount": "assets",
  "view.grid": "Grid",
  "view.list": "List",
  "onboarding.loading": "Preparing SoundAI…",
  "onboarding.subtitle": "Help us personalize SoundAI for your workflow.",
  "onboarding.step": "Step {current} of {total}",
  "onboarding.continue": "Continue",
  "onboarding.finish": "Continue to SoundAI",
  "onboarding.profile.question": "What best describes you?",
  "onboarding.profile.musicProducer": "Music Producer",
  "onboarding.profile.beatmaker": "Beatmaker",
  "onboarding.profile.composer": "Composer",
  "onboarding.profile.soundDesigner": "Sound Designer",
  "onboarding.profile.mixingEngineer": "Mixing Engineer",
  "onboarding.profile.contentCreator": "Content Creator",
  "onboarding.profile.podcastCreator": "Podcast Creator",
  "onboarding.profile.videoCreator": "Video Creator",
  "onboarding.profile.gameAudio": "Game Audio Designer",
  "onboarding.profile.student": "Student",
  "onboarding.profile.other": "Other",
  "onboarding.discovery.question": "How did you hear about SoundAI?",
  "onboarding.discovery.google": "Google Search",
  "onboarding.discovery.youtube": "YouTube",
  "onboarding.discovery.tiktok": "TikTok",
  "onboarding.discovery.instagram": "Instagram",
  "onboarding.discovery.productHunt": "Product Hunt",
  "onboarding.discovery.reddit": "Reddit",
  "onboarding.discovery.friend": "Friend",
  "onboarding.discovery.discord": "Discord",
  "onboarding.discovery.newsletter": "Newsletter",
  "onboarding.discovery.other": "Other",
  "onboarding.country.question": "What is your country of residence?",
  "onboarding.country.unitedStates": "United States",
  "onboarding.country.unitedKingdom": "United Kingdom",
  "onboarding.country.canada": "Canada",
  "onboarding.country.germany": "Germany",
  "onboarding.country.france": "France",
  "onboarding.country.spain": "Spain",
  "onboarding.country.netherlands": "Netherlands",
  "onboarding.country.australia": "Australia",
  "onboarding.country.brazil": "Brazil",
  "onboarding.country.other": "Other",
  "onboarding.goal.question": "What do you want to create most often?",
  "onboarding.goal.audioSamples": "Audio Samples",
  "onboarding.goal.midi": "MIDI",
  "onboarding.goal.vstPresets": "VST Presets",
  "onboarding.goal.soundFx": "Sound FX",
  "onboarding.goal.musicIdeas": "Music Ideas",
  "onboarding.goal.templates": "Production Templates",
  "onboarding.frequency.question": "How often do you produce music?",
  "onboarding.frequency.daily": "Daily",
  "onboarding.frequency.weekly": "Weekly",
  "onboarding.frequency.monthly": "Monthly",
  "onboarding.frequency.occasionally": "Occasionally",
  "onboarding.daw.question": "Which DAW do you use?",
  "onboarding.daw.ableton": "Ableton Live",
  "onboarding.daw.flStudio": "FL Studio",
  "onboarding.daw.logic": "Logic Pro",
  "onboarding.daw.cubase": "Cubase",
  "onboarding.daw.studioOne": "Studio One",
  "onboarding.daw.reaper": "Reaper",
  "onboarding.daw.proTools": "Pro Tools",
  "onboarding.daw.other": "Other",
  "onboarding.pain.question": "What takes the most time in your workflow?",
  "onboarding.pain.soundDesign": "Sound Design",
  "onboarding.pain.sampleSearch": "Sample Search",
  "onboarding.pain.midiWriting": "MIDI Writing",
  "onboarding.pain.arrangement": "Arrangement",
  "onboarding.pain.mixing": "Mixing",
  "onboarding.pain.presetCreation": "Preset Creation",
  "onboarding.pain.inspiration": "Inspiration",
  "prompts.templates": "Templates",
  "prompts.history": "History",
  "prompts.saved": "Saved prompts",
  "prompts.gridView": "Grid view",
  "prompts.listView": "List view",
  "prompts.statsPrompts": "Prompts",
  "prompts.statsRuns": "Total runs",
  "prompts.statsHistory": "Recent",
  "prompts.editTitle": "Edit prompt",
  "prompts.createTitle": "Create a new prompt",
  "prompts.editSubtitle": "Update this reusable prompt in your library.",
  "prompts.createSubtitle": "Add a reusable prompt and place it directly into your prompt library.",
  "prompts.fieldName": "Prompt name",
  "prompts.fieldNamePlaceholder": "Late-night tape piano",
  "prompts.fieldText": "Prompt text",
  "prompts.fieldTextPlaceholder": "Describe the mood, instrumentation and production details…",
  "prompts.addPrompt": "Add prompt",
  "prompts.copied": "Prompt copied to clipboard",
  "prompts.historyEmpty": "Recently used prompts appear here.",
  "settings.profile": "Profile",
  "settings.account": "Account",
  "settings.workspace": "Workspace",
  "settings.notifications": "Notifications",
  "settings.security": "Security",
  "settings.subscription": "Subscription",
  "settings.creditsSection": "Credits",
  "settings.integrationsSection": "Integrations",
};

const ru: Dict = {
  "nav.audioGenerator": "Создать",
  "nav.prompts": "Промпты",
  "nav.arrangement": "Аранжировка",
  "nav.editor": "Редактор",
  "nav.library": "Библиотека",
  "nav.export": "Экспорт",
  "nav.integrations": "Интеграции",
  "nav.billing": "Тарифы",
  "nav.profile": "Профиль",
  "nav.settings": "Настройки",
  "sidebar.interfaceMode": "Режим",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "sidebar.soon": "СКОРО",
  "sidebar.tools": "Инструменты",
  "header.notifications": "Уведомления",
  "header.lowCredits": "Мало кредитов — улучшите тариф",
  "upgrade.title": "Улучшить тариф",
  "upgrade.subtitle": "Сравните тарифы и откройте больше генераций, форматов и Pro-инструментов.",
  "menu.settings": "Настройки",
  "menu.language": "Язык",
  "menu.getHelp": "Помощь",
  "menu.learnMore": "Узнать больше",
  "menu.apiConsole": "API-консоль",
  "menu.aboutSoundAI": "О SoundAI",
  "menu.tutorials": "Обучение",
  "menu.courses": "Курсы",
  "menu.usagePolicy": "Правила использования",
  "menu.privacyPolicy": "Политика конфиденциальности",
  "menu.privacyChoices": "Ваши настройки приватности",
  "menu.upgradePlan": "Улучшить тариф",
  "menu.giftSoundAI": "Подарить SoundAI",
  "menu.logOut": "Выйти",
  "common.cancel": "Отмена",
  "common.save": "Сохранить",
  "common.close": "Закрыть",
  "common.all": "Все",
  "common.search": "Поиск",
  "common.new": "Новый",
  "common.back": "Назад",
  "common.manage": "Управление",
  "generator.title": "Создавайте аудио с ИИ",
  "generator.subtitle": "Генератор аудио",
  "generator.credits": "Кредиты",
  "generator.creditsRemaining": "осталось",
  "generator.adaptivePrompt": "AdaptivePrompt",
  "generator.type": "Тип",
  "generator.model": "Модель",
  "generator.outputFormat": "Формат вывода",
  "generator.import": "Импорт",
  "generator.ideas": "Идеи",
  "generator.smartNote":
    "Подсказки адаптируются по мере ввода. Тип, модель и формат синхронизируются.",
  "generator.liteNote":
    "Lite: только Audio Sample · модели Hugging Face · экспорт MP3. Pro разблокирует MIDI и VST.",
  "generator.results": "Результаты",
  "generator.insufficientCredits": "Недостаточно кредитов для генерации.",
  "prompts.title": "Промпты",
  "prompts.subtitle": "Библиотека готовых промптов",
  "prompts.new": "Новый промпт",
  "prompts.searchPlaceholder": "Поиск по промптам…",
  "prompts.noResults": "Нет промптов по заданным фильтрам.",
  "prompts.noResultsHint": "Сбросьте поиск или выберите другой жанр.",
  "arrangement.title": "Аранжировка",
  "arrangement.subtitle": "Скоро",
  "editor.title": "Редактор",
  "editor.subtitle":
    "Лёгкий редактор для сгенерированного аудио, MIDI и пресетов.",
  "editor.audio": "Аудио",
  "editor.midi": "MIDI",
  "editor.synth": "Синт",
  "editor.undo": "Отменить",
  "editor.redo": "Повторить",
  "library.title": "Библиотека",
  "library.subtitle": "Ваши сгенерированные материалы",
  "library.folders": "Папки",
  "library.newFolder": "Новая",
  "library.searchPlaceholder": "Поиск в библиотеке…",
  "library.moveTo": "В папку",
  "library.noAssets": "Нет материалов по фильтрам.",
  "library.tip":
    "Совет: перетащите файлы в папку или используйте кнопку переноса для организации перед экспортом.",
  "library.empty": "пусто",
  "export.title": "Экспорт",
  "export.subtitle": "Отправка файлов библиотеки в DAW или на диск",
  "export.selectAll": "Выбрать все",
  "export.deselectAll": "Снять выделение",
  "export.search": "Поиск файлов…",
  "export.exportSelected": "Экспорт",
  "export.noFiles": "В этой папке нет подходящих файлов.",
  "integrations.title": "Интеграции",
  "integrations.subtitle": "Подключите SoundAI к вашим инструментам",
  "billing.title": "Тарифы",
  "billing.subtitle": "Тариф, использование и счета",
  "billing.currentPlan": "Текущий тариф",
  "billing.managePlan": "Управление тарифом",
  "billing.credits": "Кредиты в этом месяце",
  "billing.creditsSuffix": "генераций",
  "billing.plans": "Тарифы",
  "billing.comparePlans": "Сравнить тарифы",
  "billing.recentInvoices": "Недавние счета",
  "billing.colDate": "Дата",
  "billing.colPlan": "Тариф",
  "billing.colAmount": "Сумма",
  "billing.colStatus": "Статус",
  "billing.resets": "Обновление 14 мая. Повысьте тариф для большего запаса.",
  "billing.popular": "Популярный",
  "billing.chooseBilling": "Выберите оплату",
  "billing.selectCredits": "Выберите пакет кредитов",
  "billing.currentPlanLabel": "Текущий тариф",
  "profile.title": "Профиль",
  "profile.subtitle": "Ваш профиль в SoundAI",
  "profile.saveChanges": "Сохранить",
  "profile.account": "Аккаунт",
  "profile.accountDesc": "Как вы отображаетесь в SoundAI.",
  "profile.displayName": "Имя",
  "profile.email": "Email",
  "profile.workspace": "Рабочее пространство",
  "profile.role": "Роль",
  "profile.changeAvatar": "Сменить аватар",
  "profile.stats": "Статистика",
  "profile.statsDesc": "Снимок вашей активности.",
  "profile.generations": "Генераций",
  "profile.savedPrompts": "Сохранённых промптов",
  "profile.libraryAssets": "Файлов в библиотеке",
  "profile.payment": "Способы оплаты",
  "profile.paymentDesc": "Карты для подписок и пакетов кредитов.",
  "profile.addPayment": "Добавить способ оплаты",
  "profile.makeDefault": "Сделать основной",
  "profile.default": "Основная",
  "profile.notifications": "Уведомления",
  "profile.notificationsDesc": "Как SoundAI связывается с вами.",
  "settings.title": "Настройки",
  "settings.subtitle": "Настройте рабочее окружение",
  "settings.save": "Сохранить",
  "settings.general": "Общие",
  "settings.generalDesc": "Рабочая область и региональные настройки.",
  "settings.workspaceName": "Название пространства",
  "settings.language": "Язык",
  "settings.languageDesc": "Язык интерфейса для меток, меню и диалогов.",
  "settings.audioQuality": "Качество аудио",
  "settings.audioQualityDesc": "Настройки по умолчанию для экспорта.",
  "settings.sampleRate": "Частота дискретизации",
  "settings.bitDepth": "Битность",
  "settings.defaultExportFormat": "Формат экспорта по умолчанию",
  "settings.dither": "Дизеринг при снижении битности",
  "settings.ditherDesc":
    "Снижает шум квантизации при экспорте в меньшей битности.",
  "settings.interface": "Интерфейс",
  "settings.interfaceDesc": "Настройте панель под ваш рабочий процесс.",
  "settings.sidebarWidth": "Ширина боковой панели",
  "settings.density": "Плотность",
  "settings.densityComfortable": "Комфортная",
  "settings.densityCompact": "Компактная",
  "settings.tooltips": "Показывать подсказки",
  "settings.tooltipsDesc": "Всплывающие пояснения на кнопках и полях.",
  "settings.devices": "Устройства",
  "settings.devicesDesc": "Аудио I/O для воспроизведения и Editor Mode.",
  "settings.inputDevice": "Устройство ввода",
  "settings.inputDeviceHint":
    "Разрешите доступ к микрофону, чтобы видеть все устройства.",
  "settings.outputDevice": "Устройство вывода",
  "settings.export": "Экспорт",
  "settings.exportDesc": "Настройки при отправке файлов из SoundAI.",
  "settings.qualityPreset": "Пресет качества",
  "settings.qualityDraft": "Черновик",
  "settings.qualityStandard": "Стандарт",
  "settings.qualityStudio": "Студия",
  "settings.stemsBundle": "Включать стемы при экспорте",
  "settings.stemsBundleDesc":
    "Добавляет отдельные стемы (drums, bass, melody) к проекту.",
  "settings.preferLossless": "Предпочитать lossless-форматы",
  "settings.preferLosslessDesc":
    "Использовать WAV / FLAC, если формат поддерживается.",
  "workspace.projects": "Проекты",
  "workspace.chats": "Чаты",
  "workspace.newChat": "Новый чат",
  "workspace.newProject": "Новый проект",
  "workspace.greeting": "Что хотите создать сегодня?",
  "workspace.suggestions": "Подсказки",
  "workspace.shuffle": "Перемешать",
  "workspace.generations": "Генерации",
  "workspace.create": "Создать",
  "workspace.generating": "Генерация",
  "workspace.addToProject": "В проект",
  "workspace.assets": "Ассеты",
  "workspace.liveSession": "Текущая сессия",
  "workspace.recent": "Недавние",
  "workspace.favorites": "Избранное",
  "workspace.audioSamples": "Аудио",
  "workspace.midiFiles": "MIDI",
  "workspace.vstPresets": "VST пресеты",
  "workspace.noAssets": "Пока нет ассетов",
  "workspace.starToSave": "Отмечайте звёздочкой",
  "workspace.renameProject": "Переименовать проект",
  "workspace.noChats": "Чатов пока нет — создайте в Create",
  "workspace.noChatsInProject": "В проекте пока нет чатов",
  "context.share": "Поделиться",
  "context.rename": "Переименовать",
  "context.moveToProject": "Переместить в проект",
  "context.noProject": "Без проекта (сайдбар)",
  "context.removeFromProject": "Убрать из проекта",
  "context.pinChat": "Закрепить чат",
  "context.pinProject": "Закрепить проект",
  "context.archive": "Архивировать",
  "context.archiveProject": "Архивировать проект",
  "context.delete": "Удалить",
  "context.deleteChatConfirm": "Удалить этот чат и все генерации?",
  "context.shareCopied": "Ссылка для sharing скопирована.",
  "voice.start": "Голосовой ввод — напев, MIDI, промпт",
  "voice.stop": "Остановить запись",
  "voice.notSupported": "Голосовой ввод не поддерживается в этом браузере.",
  "notifications.title": "Уведомления",
  "notifications.subtitle": "Генерации, биллинг и новости продукта.",
  "help.notFound": "Страница помощи не найдена",
  "menu.supportChat": "Чат поддержки",
  "help.supportChat.title": "Чат поддержки",
  "help.supportChat.body": "Напишите команде — обычно отвечаем в течение рабочего дня.",
  "help.supportChat.placeholder": "Опишите проблему или вопрос.",
  "help.supportChat.inputPlaceholder": "Введите сообщение…",
  "help.supportChat.send": "Отправить",
  "project.notFound": "Проект не найден",
  "project.backToCreate": "Вернуться к Create",
  "project.subtitle": "Чаты генераций в этом проекте",
  "project.delete": "Удалить проект",
  "project.deleteConfirm": "Удалить проект и все его чаты?",
  "project.openPage": "Открыть страницу проекта",
  "project.generations": "генераций",
  "project.assetsCount": "ассетов",
};

const es: Dict = {
  "nav.audioGenerator": "Crear",
  "sidebar.tools": "Herramientas",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "Mejorar plan",
  "upgrade.subtitle": "Compara planes y desbloquea más generaciones, formatos y flujos Pro.",
  "workspace.projects": "Proyectos",
  "workspace.newProject": "Nuevo proyecto",
  "workspace.greeting": "¿Qué te gustaría crear hoy?",
  "workspace.create": "Crear",
  "workspace.generating": "Generando",
  "workspace.generations": "Generaciones",
  "workspace.renameProject": "Renombrar proyecto",
  "workspace.noChats": "Sin chats — créalos en Crear",
  "billing.popular": "Popular",
  "billing.chooseBilling": "Elegir facturación",
  "billing.currentPlanLabel": "Plan actual",
  "header.notifications": "Notificaciones",
  "nav.prompts": "Prompts",
  "nav.arrangement": "Arreglo",
  "nav.editor": "Editor",
  "nav.library": "Biblioteca",
  "nav.export": "Exportar",
  "nav.integrations": "Integraciones",
  "nav.billing": "Facturación",
  "nav.profile": "Perfil",
  "nav.settings": "Ajustes",
  "sidebar.interfaceMode": "Modo",
  "sidebar.soon": "PRONTO",
  "menu.settings": "Ajustes",
  "menu.language": "Idioma",
  "menu.getHelp": "Ayuda",
  "menu.learnMore": "Más información",
  "menu.upgradePlan": "Mejorar plan",
  "menu.logOut": "Cerrar sesión",
  "common.all": "Todos",
  "common.search": "Buscar",
  "common.new": "Nuevo",
  "generator.title": "Crea audio con IA",
  "generator.type": "Tipo",
  "generator.model": "Modelo",
  "generator.outputFormat": "Formato de salida",
  "library.title": "Biblioteca",
  "library.folders": "Carpetas",
  "settings.title": "Ajustes",
  "settings.general": "General",
  "settings.audioQuality": "Calidad de audio",
  "settings.interface": "Interfaz",
  "settings.devices": "Dispositivos",
  "settings.export": "Exportar",
  "settings.language": "Idioma",
  "billing.title": "Facturación",
  "profile.title": "Perfil",
  "integrations.title": "Integraciones",
  "prompts.title": "Prompts",
  "export.title": "Exportar",
  "editor.title": "Editor",
};

const fr: Dict = {
  "nav.audioGenerator": "Créer",
  "sidebar.tools": "Outils",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "Changer de plan",
  "upgrade.subtitle": "Comparez les offres et débloquez plus de générations, formats et workflows Pro.",
  "workspace.projects": "Projets",
  "workspace.newProject": "Nouveau projet",
  "workspace.greeting": "Que souhaitez-vous créer aujourd'hui ?",
  "workspace.create": "Créer",
  "workspace.generating": "Génération",
  "workspace.generations": "Générations",
  "workspace.renameProject": "Renommer le projet",
  "workspace.noChats": "Aucun chat — créez depuis Créer",
  "billing.popular": "Populaire",
  "billing.chooseBilling": "Choisir la facturation",
  "billing.currentPlanLabel": "Offre actuelle",
  "header.notifications": "Notifications",
  "nav.prompts": "Prompts",
  "nav.arrangement": "Arrangement",
  "nav.editor": "Éditeur",
  "nav.library": "Bibliothèque",
  "nav.export": "Exporter",
  "nav.integrations": "Intégrations",
  "nav.billing": "Facturation",
  "nav.profile": "Profil",
  "nav.settings": "Paramètres",
  "sidebar.interfaceMode": "Mode",
  "sidebar.soon": "BIENTÔT",
  "menu.settings": "Paramètres",
  "menu.language": "Langue",
  "menu.getHelp": "Aide",
  "menu.learnMore": "En savoir plus",
  "menu.upgradePlan": "Changer de plan",
  "menu.logOut": "Se déconnecter",
  "common.all": "Tout",
  "common.search": "Rechercher",
  "common.new": "Nouveau",
  "generator.title": "Créer de l'audio avec l'IA",
  "generator.type": "Type",
  "generator.model": "Modèle",
  "generator.outputFormat": "Format de sortie",
  "library.title": "Bibliothèque",
  "library.folders": "Dossiers",
  "settings.title": "Paramètres",
  "settings.general": "Général",
  "settings.audioQuality": "Qualité audio",
  "settings.interface": "Interface",
  "settings.devices": "Appareils",
  "settings.export": "Exporter",
  "settings.language": "Langue",
  "billing.title": "Facturation",
  "profile.title": "Profil",
  "integrations.title": "Intégrations",
  "prompts.title": "Prompts",
  "export.title": "Exporter",
  "editor.title": "Éditeur",
};

const de: Dict = {
  "nav.audioGenerator": "Erstellen",
  "sidebar.tools": "Werkzeuge",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "Plan upgraden",
  "upgrade.subtitle": "Pläne vergleichen und mehr Generierungen, Formate und Pro-Workflows freischalten.",
  "workspace.projects": "Projekte",
  "workspace.newProject": "Neues Projekt",
  "workspace.greeting": "Was möchten Sie heute erstellen?",
  "workspace.create": "Erstellen",
  "workspace.generating": "Generierung",
  "workspace.generations": "Generierungen",
  "workspace.renameProject": "Projekt umbenennen",
  "workspace.noChats": "Keine Chats — in Erstellen anlegen",
  "billing.popular": "Beliebt",
  "billing.chooseBilling": "Abrechnung wählen",
  "billing.currentPlanLabel": "Aktueller Plan",
  "header.notifications": "Benachrichtigungen",
  "nav.prompts": "Prompts",
  "nav.arrangement": "Arrangement",
  "nav.editor": "Editor",
  "nav.library": "Bibliothek",
  "nav.export": "Export",
  "nav.integrations": "Integrationen",
  "nav.billing": "Abrechnung",
  "nav.profile": "Profil",
  "nav.settings": "Einstellungen",
  "sidebar.interfaceMode": "Modus",
  "sidebar.soon": "BALD",
  "menu.settings": "Einstellungen",
  "menu.language": "Sprache",
  "menu.getHelp": "Hilfe",
  "menu.learnMore": "Mehr erfahren",
  "menu.upgradePlan": "Plan upgraden",
  "menu.logOut": "Abmelden",
  "common.all": "Alle",
  "common.search": "Suchen",
  "common.new": "Neu",
  "generator.title": "Audio mit KI erstellen",
  "generator.type": "Typ",
  "generator.model": "Modell",
  "generator.outputFormat": "Ausgabeformat",
  "library.title": "Bibliothek",
  "library.folders": "Ordner",
  "settings.title": "Einstellungen",
  "settings.general": "Allgemein",
  "settings.audioQuality": "Audioqualität",
  "settings.interface": "Oberfläche",
  "settings.devices": "Geräte",
  "settings.export": "Export",
  "settings.language": "Sprache",
  "billing.title": "Abrechnung",
  "profile.title": "Profil",
  "integrations.title": "Integrationen",
  "prompts.title": "Prompts",
  "export.title": "Export",
  "editor.title": "Editor",
};

const pt: Dict = {
  "nav.audioGenerator": "Criar",
  "sidebar.tools": "Ferramentas",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "Atualizar plano",
  "workspace.projects": "Projetos",
  "workspace.create": "Criar",
  "workspace.greeting": "O que você quer criar hoje?",
  "nav.prompts": "Prompts",
  "nav.arrangement": "Arranjo",
  "nav.editor": "Editor",
  "nav.library": "Biblioteca",
  "nav.export": "Exportar",
  "nav.integrations": "Integrações",
  "nav.billing": "Faturamento",
  "nav.profile": "Perfil",
  "nav.settings": "Configurações",
  "sidebar.soon": "EM BREVE",
  "menu.settings": "Configurações",
  "menu.language": "Idioma",
  "menu.getHelp": "Ajuda",
  "menu.learnMore": "Saiba mais",
  "menu.upgradePlan": "Atualizar plano",
  "menu.logOut": "Sair",
  "common.all": "Todos",
  "common.search": "Buscar",
  "common.new": "Novo",
  "generator.type": "Tipo",
  "generator.model": "Modelo",
  "generator.outputFormat": "Formato de saída",
  "library.folders": "Pastas",
  "settings.general": "Geral",
  "settings.interface": "Interface",
};

const it: Dict = {
  "nav.audioGenerator": "Crea",
  "sidebar.tools": "Strumenti",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "Aggiorna piano",
  "workspace.projects": "Progetti",
  "workspace.create": "Crea",
  "workspace.greeting": "Cosa vuoi creare oggi?",
  "nav.prompts": "Prompt",
  "nav.arrangement": "Arrangiamento",
  "nav.editor": "Editor",
  "nav.library": "Libreria",
  "nav.export": "Esporta",
  "nav.integrations": "Integrazioni",
  "nav.billing": "Fatturazione",
  "nav.profile": "Profilo",
  "nav.settings": "Impostazioni",
  "sidebar.soon": "PRESTO",
  "menu.settings": "Impostazioni",
  "menu.language": "Lingua",
  "menu.getHelp": "Aiuto",
  "menu.learnMore": "Scopri di più",
  "menu.upgradePlan": "Aggiorna piano",
  "menu.logOut": "Esci",
  "common.all": "Tutti",
  "common.search": "Cerca",
  "common.new": "Nuovo",
  "generator.type": "Tipo",
  "generator.model": "Modello",
  "generator.outputFormat": "Formato di output",
  "library.folders": "Cartelle",
  "settings.general": "Generale",
  "settings.interface": "Interfaccia",
};

const ja: Dict = {
  "nav.audioGenerator": "作成",
  "sidebar.tools": "ツール",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "プランを変更",
  "workspace.projects": "プロジェクト",
  "workspace.create": "作成",
  "workspace.greeting": "今日は何を作りますか？",
  "nav.prompts": "プロンプト",
  "nav.arrangement": "アレンジ",
  "nav.editor": "エディター",
  "nav.library": "ライブラリ",
  "nav.export": "エクスポート",
  "nav.integrations": "連携",
  "nav.billing": "請求",
  "nav.profile": "プロフィール",
  "nav.settings": "設定",
  "sidebar.soon": "近日公開",
  "menu.settings": "設定",
  "menu.language": "言語",
  "menu.getHelp": "ヘルプ",
  "menu.learnMore": "詳細",
  "menu.upgradePlan": "プランを変更",
  "menu.logOut": "ログアウト",
  "common.all": "すべて",
  "common.search": "検索",
  "common.new": "新規",
  "generator.type": "タイプ",
  "generator.model": "モデル",
  "generator.outputFormat": "出力形式",
  "library.folders": "フォルダ",
  "settings.general": "一般",
  "settings.interface": "インターフェース",
};

const zh: Dict = {
  "nav.audioGenerator": "创作",
  "sidebar.tools": "工具",
  "sidebar.lite": "Lite",
  "sidebar.pro": "Pro",
  "upgrade.title": "升级方案",
  "workspace.projects": "项目",
  "workspace.create": "创作",
  "workspace.greeting": "今天想创作什么？",
  "nav.prompts": "提示词",
  "nav.arrangement": "编排",
  "nav.editor": "编辑器",
  "nav.library": "资源库",
  "nav.export": "导出",
  "nav.integrations": "集成",
  "nav.billing": "订阅",
  "nav.profile": "资料",
  "nav.settings": "设置",
  "sidebar.soon": "即将推出",
  "menu.settings": "设置",
  "menu.language": "语言",
  "menu.getHelp": "帮助",
  "menu.learnMore": "了解更多",
  "menu.upgradePlan": "升级方案",
  "menu.logOut": "退出",
  "common.all": "全部",
  "common.search": "搜索",
  "common.new": "新建",
  "generator.type": "类型",
  "generator.model": "模型",
  "generator.outputFormat": "输出格式",
  "library.folders": "文件夹",
  "settings.general": "常规",
  "settings.interface": "界面",
};

const ar: Dict = {
  "nav.audioGenerator": "إنشاء",
  "nav.prompts": "المطالبات",
  "nav.library": "المكتبة",
  "nav.export": "تصدير",
  "nav.settings": "الإعدادات",
  "sidebar.tools": "الأدوات",
  "workspace.create": "إنشاء",
  "workspace.greeting": "ماذا تريد أن تنشئ اليوم؟",
  "onboarding.continue": "متابعة",
  "onboarding.finish": "دخول الاستوديو",
  "onboarding.profile.question": "ما الذي يصفك بشكل أفضل؟",
  "view.grid": "شبكة",
  "view.list": "قائمة",
  "common.back": "رجوع",
  "common.cancel": "إلغاء",
  "common.save": "حفظ",
};

export const DICTIONARIES: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  ru: { ...en, ...ru },
  es: { ...en, ...es },
  fr: { ...en, ...fr },
  de: { ...en, ...de },
  pt: { ...en, ...pt },
  it: { ...en, ...it },
  ja: { ...en, ...ja },
  zh: { ...en, ...zh },
  ar: { ...en, ...ar },
};

export function translate(lang: LanguageCode, key: TranslationKey): string {
  return DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
}
