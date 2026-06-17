import { useState } from "react";
import { Link } from "react-router-dom";
import WorkspacePageShell from "../components/workspace/WorkspacePageShell";
import SettingsContent from "../components/SettingsContent";
import { useLanguage } from "../i18n/LanguageProvider";

type SettingsSection =
  | "profile"
  | "account"
  | "workspace"
  | "language"
  | "notifications"
  | "security"
  | "subscription"
  | "credits"
  | "integrations";

const SECTIONS: { id: SettingsSection; labelKey: string; route?: string }[] = [
  { id: "profile", labelKey: "settings.profile", route: "/app/profile" },
  { id: "account", labelKey: "settings.account" },
  { id: "workspace", labelKey: "settings.workspace" },
  { id: "language", labelKey: "settings.language" },
  { id: "notifications", labelKey: "settings.notifications", route: "/app/notifications" },
  { id: "security", labelKey: "settings.security" },
  { id: "subscription", labelKey: "settings.subscription", route: "/app/billing" },
  { id: "credits", labelKey: "settings.creditsSection" },
  { id: "integrations", labelKey: "settings.integrationsSection", route: "/app/integrations" },
];

export default function Settings() {
  const { t } = useLanguage();
  const [active, setActive] = useState<SettingsSection>("workspace");

  return (
    <WorkspacePageShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            const className = `whitespace-nowrap rounded-[10px] px-3 py-2 text-left font-codec text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            }`;

            if (section.route && section.id !== "workspace" && section.id !== "language") {
              return (
                <Link key={section.id} to={section.route} className={className}>
                  {t(section.labelKey as Parameters<typeof t>[0])}
                </Link>
              );
            }

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActive(section.id)}
                className={className}
              >
                {t(section.labelKey as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {(active === "workspace" || active === "language" || active === "account" || active === "security" || active === "credits") && (
            <SettingsContent />
          )}
          {active === "profile" && (
            <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-primary)] p-6">
              <p className="font-codec text-sm text-[var(--text-secondary)]">
                {t("settings.profile")} — open the dedicated profile page to edit your public info.
              </p>
              <Link to="/app/profile" className="app-btn-primary mt-4 inline-flex h-9 px-4">
                {t("nav.profile")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </WorkspacePageShell>
  );
}
