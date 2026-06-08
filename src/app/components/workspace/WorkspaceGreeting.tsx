import { useLanguage } from "../../i18n/LanguageProvider";

const USER_NAME = "Dmitriy";

function timeGreeting(lang: string): string {
  const hour = new Date().getHours();
  if (lang === "ru") {
    if (hour < 12) return "Доброе утро";
    if (hour < 18) return "Добрый день";
    return "Добрый вечер";
  }
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function WorkspaceGreeting() {
  const { language, t } = useLanguage();
  return (
    <div className="mb-6 text-center">
      <p className="font-codec text-[15px] text-[var(--text-secondary)]">
        {timeGreeting(language)}, {USER_NAME}
      </p>
      <h1 className="generator-hero-title mt-2 font-syne text-[32px] font-bold tracking-[-0.03em] sm:text-[38px]">
        {t("workspace.greeting")}
      </h1>
    </div>
  );
}
