import { Link, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer";
import { useLanguage } from "../../i18n/LanguageProvider";

const HELP_CONTENT: Record<
  string,
  { titleKey: string; bodyKey: string }
> = {
  api: { titleKey: "help.api.title", bodyKey: "help.api.body" },
  about: { titleKey: "help.about.title", bodyKey: "help.about.body" },
  tutorials: { titleKey: "help.tutorials.title", bodyKey: "help.tutorials.body" },
  courses: { titleKey: "help.courses.title", bodyKey: "help.courses.body" },
  usage: { titleKey: "help.usage.title", bodyKey: "help.usage.body" },
  privacy: { titleKey: "help.privacy.title", bodyKey: "help.privacy.body" },
  "privacy-choices": { titleKey: "help.privacyChoices.title", bodyKey: "help.privacyChoices.body" },
  "support-chat": { titleKey: "help.supportChat.title", bodyKey: "help.supportChat.body" },
};

export default function HelpPage() {
  const { slug = "" } = useParams();
  const { t } = useLanguage();
  const content = HELP_CONTENT[slug];

  if (!content) {
    return (
      <PageContainer title={t("help.notFound")} subtitle="">
        <Link to="/app/generator" className="text-primary hover:underline">
          {t("common.back")}
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t(content.titleKey as never)} subtitle="">
      <div className="token-card max-w-3xl rounded-card p-6">
        <p className="font-codec text-[14px] leading-7 text-[var(--text-secondary)]">
          {t(content.bodyKey as never)}
        </p>
        {slug === "support-chat" && (
          <div className="mt-6 rounded-card border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-4">
            <p className="font-codec text-[13px] text-[var(--text-muted)]">
              {t("help.supportChat.placeholder")}
            </p>
            <textarea
              className="app-input mt-3 min-h-[120px] resize-y"
              placeholder={t("help.supportChat.inputPlaceholder")}
            />
            <button type="button" className="app-btn-primary mt-3 h-10 px-5">
              {t("help.supportChat.send")}
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
