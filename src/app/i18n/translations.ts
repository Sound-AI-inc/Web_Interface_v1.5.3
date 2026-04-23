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
  | "settings.preferLosslessDesc";

type Dict = Partial<Record<TranslationKey, string>>;

const en: Record<TranslationKey, string> = {
  "nav.audioGenerator": "Audio Generator",
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
};

const ru: Dict = {
  "nav.audioGenerator": "Генератор",
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
};

const es: Dict = {
  "nav.audioGenerator": "Generador",
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
  "nav.audioGenerator": "Générateur",
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
  "nav.audioGenerator": "Generator",
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
  "nav.audioGenerator": "Gerador",
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
  "nav.audioGenerator": "Generatore",
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
  "nav.audioGenerator": "ジェネレーター",
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
  "nav.audioGenerator": "生成器",
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

export const DICTIONARIES: Record<LanguageCode, Dict> = {
  en,
  ru,
  es,
  fr,
  de,
  pt,
  it,
  ja,
  zh,
};

export function translate(lang: LanguageCode, key: TranslationKey): string {
  return DICTIONARIES[lang]?.[key] ?? en[key] ?? key;
}
