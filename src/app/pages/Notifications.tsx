import PageContainer from "../components/PageContainer";
import { useLanguage } from "../i18n/LanguageProvider";

export default function Notifications() {
  const { t } = useLanguage();

  return (
    <PageContainer title={t("notifications.title")} subtitle={t("notifications.subtitle")}>
      <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-primary)] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
          <svg className="h-6 w-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="mt-4 font-poppins text-lg font-semibold text-[var(--text-primary)]">
          {t("notifications.empty.title")}
        </h3>
        <p className="mt-2 font-codec text-sm text-[var(--text-secondary)]">
          {t("notifications.empty.body")}
        </p>
      </div>
    </PageContainer>
  );
}
