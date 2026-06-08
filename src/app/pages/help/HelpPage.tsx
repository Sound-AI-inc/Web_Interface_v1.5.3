import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, MessageSquare, Shield, Terminal } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";

const HELP_SLUGS = [
  "api",
  "about",
  "tutorials",
  "courses",
  "usage",
  "privacy",
  "privacy-choices",
  "support-chat",
] as const;

type HelpSlug = (typeof HELP_SLUGS)[number];

const HELP_META: Record<
  HelpSlug,
  {
    titleKey: string;
    bodyKey: string;
    heroKey: string;
    icon: typeof Terminal;
    bullets: string[];
  }
> = {
  api: {
    titleKey: "help.api.title",
    bodyKey: "help.api.body",
    heroKey: "help.api.hero",
    icon: Terminal,
    bullets: ["help.api.b1", "help.api.b2", "help.api.b3"],
  },
  about: {
    titleKey: "help.about.title",
    bodyKey: "help.about.body",
    heroKey: "help.about.hero",
    icon: BookOpen,
    bullets: ["help.about.b1", "help.about.b2", "help.about.b3"],
  },
  tutorials: {
    titleKey: "help.tutorials.title",
    bodyKey: "help.tutorials.body",
    heroKey: "help.tutorials.hero",
    icon: BookOpen,
    bullets: ["help.tutorials.b1", "help.tutorials.b2", "help.tutorials.b3"],
  },
  courses: {
    titleKey: "help.courses.title",
    bodyKey: "help.courses.body",
    heroKey: "help.courses.hero",
    icon: BookOpen,
    bullets: ["help.courses.b1", "help.courses.b2", "help.courses.b3"],
  },
  usage: {
    titleKey: "help.usage.title",
    bodyKey: "help.usage.body",
    heroKey: "help.usage.hero",
    icon: Shield,
    bullets: ["help.usage.b1", "help.usage.b2", "help.usage.b3"],
  },
  privacy: {
    titleKey: "help.privacy.title",
    bodyKey: "help.privacy.body",
    heroKey: "help.privacy.hero",
    icon: Shield,
    bullets: ["help.privacy.b1", "help.privacy.b2", "help.privacy.b3"],
  },
  "privacy-choices": {
    titleKey: "help.privacyChoices.title",
    bodyKey: "help.privacyChoices.body",
    heroKey: "help.privacyChoices.hero",
    icon: Shield,
    bullets: ["help.privacyChoices.b1", "help.privacyChoices.b2", "help.privacyChoices.b3"],
  },
  "support-chat": {
    titleKey: "help.supportChat.title",
    bodyKey: "help.supportChat.body",
    heroKey: "help.supportChat.hero",
    icon: MessageSquare,
    bullets: ["help.supportChat.b1", "help.supportChat.b2", "help.supportChat.b3"],
  },
};

function isHelpSlug(slug: string): slug is HelpSlug {
  return (HELP_SLUGS as readonly string[]).includes(slug);
}

export default function HelpPage() {
  const { slug = "" } = useParams();
  const { t } = useLanguage();
  const meta = isHelpSlug(slug) ? HELP_META[slug] : null;
  const Icon = meta?.icon ?? BookOpen;

  if (!meta) {
    return (
      <HelpShell>
        <div className="help-landing-card p-10 text-center">
          <h1 className="font-syne text-2xl font-bold">{t("help.notFound")}</h1>
          <Link to="/app/generator" className="app-btn-primary mt-6 inline-flex h-10 px-6">
            {t("common.back")}
          </Link>
        </div>
      </HelpShell>
    );
  }

  return (
    <HelpShell>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <section className="help-landing-hero relative overflow-hidden rounded-[28px] p-10">
          <div className="relative z-[1]">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <p className="font-codec text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              SoundAI
            </p>
            <h1 className="mt-3 font-syne text-[36px] font-bold leading-tight tracking-[-0.03em]">
              {t(meta.titleKey as never)}
            </h1>
            <p className="mt-4 max-w-md font-codec text-[16px] leading-7 text-[var(--text-secondary)]">
              {t(meta.heroKey as never)}
            </p>
          </div>
        </section>

        <section className="help-landing-card p-8 sm:p-10">
          <p className="font-codec text-[15px] leading-7 text-[var(--text-secondary)]">
            {t(meta.bodyKey as never)}
          </p>

          <ul className="mt-8 space-y-3">
            {meta.bullets.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-card border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-3 font-codec text-[13px] text-[var(--text-primary)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {t(key as never)}
              </li>
            ))}
          </ul>

          {slug === "support-chat" && (
            <div className="mt-8 rounded-card border border-[var(--border-primary)] bg-[var(--surface-secondary)] p-5">
              <p className="font-codec text-[13px] text-[var(--text-muted)]">
                {t("help.supportChat.placeholder")}
              </p>
              <textarea
                className="app-input mt-3 min-h-[120px] resize-y"
                placeholder={t("help.supportChat.inputPlaceholder")}
              />
              <button type="button" className="app-btn-primary mt-4 h-10 px-6">
                {t("help.supportChat.send")}
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app/generator" className="app-btn-primary h-10 px-6">
              {t("help.openApp")}
            </Link>
            <a
              href="mailto:support@soundai.studio"
              className="app-btn-ghost h-10 px-6"
            >
              {t("help.contactEmail")}
            </a>
          </div>
        </section>
      </div>
    </HelpShell>
  );
}

function HelpShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      data-theme="pro"
      className="theme-pro min-h-screen bg-[var(--background-primary)] font-codec text-[var(--text-primary)]"
    >
      <div className="mx-auto min-h-screen w-full max-w-[1180px] px-6 py-10">
        <Link
          to="/app/generator"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          SoundAI
        </Link>
        {children}
      </div>
    </main>
  );
}
