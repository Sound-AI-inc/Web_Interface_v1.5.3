import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ExternalLink } from "lucide-react";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import SettingsContent from "../components/SettingsContent";
import Integrations from "./Integrations";
import { useLanguage } from "../i18n/LanguageProvider";
import { useCredits } from "../hooks/useCredits";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

type SettingsCategory =
  | "general"
  | "audio"
  | "generation"
  | "appearance"
  | "notifications"
  | "integrations"
  | "billing"
  | "usage"
  | "profile"
  | "account"
  | "security";

interface CategoryDef {
  id: SettingsCategory;
  labelKey: string;
  descriptionKey?: string;
  route?: string;
  external?: boolean;
}

const CATEGORIES: CategoryDef[] = [
  { id: "general", labelKey: "settings.general", descriptionKey: "settings.generalDesc" },
  { id: "audio", labelKey: "settings.audioQuality", descriptionKey: "settings.audioQualityDesc" },
  { id: "generation", labelKey: "settings.generation", descriptionKey: "settings.generationDesc" },
  { id: "appearance", labelKey: "settings.appearance", descriptionKey: "settings.appearanceDesc" },
  { id: "notifications", labelKey: "settings.notifications", route: "/app/notifications" },
  { id: "integrations", labelKey: "settings.integrationsSection" },
  { id: "billing", labelKey: "settings.subscription", route: "/app/billing" },
  { id: "usage", labelKey: "settings.usage", descriptionKey: "settings.usageDesc" },
  { id: "profile", labelKey: "settings.profile", route: "/app/profile" },
  { id: "account", labelKey: "settings.account" },
  { id: "security", labelKey: "settings.security" },
];

function CategoryNavItem({
  category,
  isActive,
  onClick,
  t,
}: {
  category: CategoryDef;
  isActive: boolean;
  onClick: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const className = `w-full rounded-[10px] px-3 py-2.5 text-left font-codec text-xs font-medium transition-colors ${
    isActive
      ? "bg-primary/10 text-primary"
      : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
  }`;

  if (category.route && category.external !== true) {
    return (
      <Link key={category.id} to={category.route} className={className}>
        <span className="flex items-center gap-2">
          {t(category.labelKey as Parameters<typeof t>[0])}
          {category.external && <ExternalLink className="h-3 w-3 opacity-50" />}
        </span>
      </Link>
    );
  }

  return (
    <button
      key={category.id}
      type="button"
      onClick={onClick}
      className={className}
    >
      {t(category.labelKey as Parameters<typeof t>[0])}
    </button>
  );
}

function SettingsCategoryContent({
  category,
  t,
  credits,
  isPro,
}: {
  category: SettingsCategory;
  t: ReturnType<typeof useLanguage>["t"];
  credits: ReturnType<typeof useCredits>;
  isPro: boolean;
}) {
  switch (category) {
    case "general":
      return <SettingsContent />;
    case "audio":
      return <SettingsContent />;
    case "generation":
      return (
        <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6 space-y-6">
          <div>
            <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
              {t("settings.generation")}
            </h3>
            <p className="app-meta mt-1">{t("settings.generationDesc")}</p>
          </div>
          <div className="space-y-4">
            <p className="font-codec text-sm text-[var(--text-secondary)]">
              Generation defaults are configured per-session in the Create page.
              Model, format, and count selections persist for the current session.
            </p>
            <p className="font-codec text-sm text-[var(--text-muted)]">
              Pro users can access MIDI Melody and VST Preset generation types.
            </p>
          </div>
        </div>
      );
    case "appearance":
      return <SettingsContent />;
    case "notifications":
      return (
        <Link to="/app/notifications" className="block">
          <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6 text-center">
            <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
              {t("settings.notifications")}
            </h3>
            <p className="app-meta mt-2">
              Notification preferences are managed on the dedicated Notifications page.
            </p>
            <button type="button" className="app-btn-primary mt-4">
              {t("common.manage")}
            </button>
          </div>
        </Link>
      );
    case "integrations":
      return <Integrations />;
    case "billing":
      return (
        <Link to="/app/billing" className="block">
          <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6 text-center">
            <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
              {t("settings.subscription")}
            </h3>
            <p className="app-meta mt-2">
              Plan management, credit packages, and invoices are on the Billing page.
            </p>
            <button type="button" className="app-btn-primary mt-4">
              {t("billing.managePlan")}
            </button>
          </div>
        </Link>
      );
    case "usage":
      return (
        <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6 space-y-6">
          <div>
            <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
              {t("settings.usage")}
            </h3>
            <p className="app-meta mt-1">{t("settings.usageDesc")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card bg-[var(--surface-primary)] p-4 border border-[var(--border-primary)]">
              <div className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t("billing.credits")}
              </div>
              <div className="mt-2 font-syne text-3xl font-bold text-[var(--text-primary)]">
                {credits.remaining}
              </div>
              <div className="font-codec text-xs text-[var(--text-muted)]">
                {t("generator.creditsRemaining")}
              </div>
            </div>
            <div className="rounded-card bg-[var(--surface-primary)] p-4 border border-[var(--border-primary)]">
              <div className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t("billing.currentPlanLabel")}
              </div>
              <div className="mt-2 font-poppins text-xl font-semibold text-[var(--text-primary)]">
                {isPro ? "Pro" : "Lite"}
              </div>
            </div>
            <div className="rounded-card bg-[var(--surface-primary)] p-4 border border-[var(--border-primary)]">
              <div className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Monthly Allowance
              </div>
              <div className="mt-2 font-syne text-3xl font-bold text-[var(--text-primary)]">
                {credits.total}
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--border-primary)]">
            <button
              type="button"
              onClick={credits.refresh}
              disabled={credits.loading}
              className="app-btn-ghost h-9 px-4"
            >
              {credits.loading ? t("common.search") + "…" : t("settings.search") + " / Refresh"}
            </button>
          </div>
        </div>
      );
    case "profile":
      return (
        <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
          <p className="font-codec text-sm text-[var(--text-secondary)]">
            {t("settings.profile")} — open the dedicated profile page to edit your public info.
          </p>
          <Link to="/app/profile" className="app-btn-primary mt-4 inline-flex h-9 px-4">
            {t("nav.profile")}
          </Link>
        </div>
      );
    case "account":
      return (
        <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6">
          <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
            {t("settings.account")}
          </h3>
          <p className="app-meta mt-2">
            Account settings are managed through your authentication provider.
          </p>
        </div>
      );
    case "security":
      return (
        <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)] p-6">
          <h3 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
            {t("settings.security")}
          </h3>
          <p className="app-meta mt-2">
            Security settings like two-factor authentication are handled by your auth provider.
          </p>
        </div>
      );
    default:
      return null;
  }
}

export default function Settings() {
  const { t } = useLanguage();
  const credits = useCredits();
  const { mode } = useInterfaceMode();
  const isPro = mode === "pro";

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return CATEGORIES;
    const query = searchQuery.toLowerCase();
    return CATEGORIES.filter((cat) => {
      const label = t(cat.labelKey as Parameters<typeof t>[0]).toLowerCase();
      const desc = cat.descriptionKey ? t(cat.descriptionKey as Parameters<typeof t>[0]).toLowerCase() : "";
      return label.includes(query) || desc.includes(query);
    });
  }, [searchQuery, t]);

  return (
    <WorkspacePageShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <nav className="flex flex-col gap-4 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("settings.searchPlaceholder")}
              className="app-input pl-10"
              aria-label={t("settings.search")}
            />
          </div>

          <div className="flex flex-col gap-1">
            {filteredCategories.map((category) => (
              <CategoryNavItem
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                t={t}
              />
            ))}
          </div>
        </nav>

        <div className="min-w-0">
          <SettingsCategoryContent
            category={activeCategory}
            t={t}
            credits={credits}
            isPro={isPro}
          />
        </div>
      </div>
    </WorkspacePageShell>
  );
}