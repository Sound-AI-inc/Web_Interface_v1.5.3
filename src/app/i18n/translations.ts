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
  | "sidebar.interfaceMode"
  | "sidebar.lite"
  | "sidebar.pro"
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
  | "settings.title"
  | "settings.subtitle"
  | "settings.general"
  | "settings.audioQuality"
  | "settings.interface"
  | "settings.devices"
  | "settings.export"
  | "settings.language"
  | "settings.languageDesc"
  | "settings.save"
  | "common.cancel"
  | "common.save"
  | "common.close"
  | "export.title"
  | "export.subtitle"
  | "export.selectAll"
  | "export.deselectAll"
  | "export.search"
  | "export.exportSelected"
  | "library.title"
  | "library.subtitle";

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
  "settings.title": "Settings",
  "settings.subtitle": "Fine-tune your studio environment",
  "settings.general": "General",
  "settings.audioQuality": "Audio Quality",
  "settings.interface": "Interface",
  "settings.devices": "Devices",
  "settings.export": "Export",
  "settings.language": "Language",
  "settings.languageDesc": "Interface language for labels, menus and dialogs.",
  "settings.save": "Save preferences",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.close": "Close",
  "export.title": "Export",
  "export.subtitle": "Send library assets to your local DAW or disk",
  "export.selectAll": "Select all",
  "export.deselectAll": "Deselect all",
  "export.search": "Search files…",
  "export.exportSelected": "Export",
  "library.title": "Library",
  "library.subtitle": "Your generated assets, organized",
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
  "settings.title": "Настройки",
  "settings.subtitle": "Настройте рабочее окружение",
  "settings.general": "Общие",
  "settings.audioQuality": "Качество аудио",
  "settings.interface": "Интерфейс",
  "settings.devices": "Устройства",
  "settings.export": "Экспорт",
  "settings.language": "Язык",
  "settings.languageDesc": "Язык интерфейса для меток, меню и диалогов.",
  "settings.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.save": "Сохранить",
  "common.close": "Закрыть",
  "export.title": "Экспорт",
  "export.subtitle": "Отправка файлов библиотеки в DAW или на диск",
  "export.selectAll": "Выбрать все",
  "export.deselectAll": "Снять выделение",
  "export.search": "Поиск файлов…",
  "export.exportSelected": "Экспорт",
  "library.title": "Библиотека",
  "library.subtitle": "Ваши сгенерированные материалы",
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
  "menu.settings": "Ajustes",
  "menu.language": "Idioma",
  "menu.getHelp": "Ayuda",
  "menu.learnMore": "Más información",
  "menu.apiConsole": "Consola API",
  "menu.aboutSoundAI": "Sobre SoundAI",
  "menu.tutorials": "Tutoriales",
  "menu.courses": "Cursos",
  "menu.usagePolicy": "Política de uso",
  "menu.privacyPolicy": "Política de privacidad",
  "menu.privacyChoices": "Preferencias de privacidad",
  "menu.upgradePlan": "Mejorar plan",
  "menu.giftSoundAI": "Regalar SoundAI",
  "menu.logOut": "Cerrar sesión",
  "settings.title": "Ajustes",
  "settings.general": "General",
  "settings.audioQuality": "Calidad de audio",
  "settings.interface": "Interfaz",
  "settings.devices": "Dispositivos",
  "settings.export": "Exportar",
  "settings.language": "Idioma",
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
  "menu.settings": "Paramètres",
  "menu.language": "Langue",
  "menu.getHelp": "Aide",
  "menu.learnMore": "En savoir plus",
  "menu.apiConsole": "Console API",
  "menu.aboutSoundAI": "À propos",
  "menu.tutorials": "Tutoriels",
  "menu.courses": "Cours",
  "menu.usagePolicy": "Politique d'utilisation",
  "menu.privacyPolicy": "Politique de confidentialité",
  "menu.privacyChoices": "Vos choix de confidentialité",
  "menu.upgradePlan": "Changer de plan",
  "menu.giftSoundAI": "Offrir SoundAI",
  "menu.logOut": "Se déconnecter",
  "settings.title": "Paramètres",
  "settings.general": "Général",
  "settings.audioQuality": "Qualité audio",
  "settings.interface": "Interface",
  "settings.devices": "Appareils",
  "settings.export": "Exporter",
  "settings.language": "Langue",
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
  "menu.settings": "Einstellungen",
  "menu.language": "Sprache",
  "menu.getHelp": "Hilfe",
  "menu.learnMore": "Mehr erfahren",
  "menu.apiConsole": "API-Konsole",
  "menu.aboutSoundAI": "Über SoundAI",
  "menu.tutorials": "Tutorials",
  "menu.courses": "Kurse",
  "menu.usagePolicy": "Nutzungsrichtlinie",
  "menu.privacyPolicy": "Datenschutz",
  "menu.privacyChoices": "Ihre Datenschutzoptionen",
  "menu.upgradePlan": "Plan upgraden",
  "menu.giftSoundAI": "SoundAI verschenken",
  "menu.logOut": "Abmelden",
  "settings.title": "Einstellungen",
  "settings.general": "Allgemein",
  "settings.audioQuality": "Audioqualität",
  "settings.interface": "Oberfläche",
  "settings.devices": "Geräte",
  "settings.export": "Export",
  "settings.language": "Sprache",
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
  "menu.settings": "Configurações",
  "menu.language": "Idioma",
  "menu.getHelp": "Ajuda",
  "menu.learnMore": "Saiba mais",
  "menu.upgradePlan": "Atualizar plano",
  "menu.logOut": "Sair",
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
  "menu.settings": "Impostazioni",
  "menu.language": "Lingua",
  "menu.getHelp": "Aiuto",
  "menu.learnMore": "Scopri di più",
  "menu.upgradePlan": "Aggiorna piano",
  "menu.logOut": "Esci",
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
  "menu.settings": "設定",
  "menu.language": "言語",
  "menu.getHelp": "ヘルプ",
  "menu.learnMore": "詳細",
  "menu.upgradePlan": "プランを変更",
  "menu.logOut": "ログアウト",
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
  "menu.settings": "设置",
  "menu.language": "语言",
  "menu.getHelp": "帮助",
  "menu.learnMore": "了解更多",
  "menu.upgradePlan": "升级方案",
  "menu.logOut": "退出",
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
