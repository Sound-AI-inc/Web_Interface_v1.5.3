import { useState } from "react";
import PageContainer from "../components/PageContainer";
import { Field, SettingsSection, Toggle } from "../components/SettingsForm";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuth } from "../hooks/useAuth";
import { useLibraryStore } from "../state/libraryStore";
import { usePromptsStore } from "../state/promptsStore";
import { useWorkspaceStore } from "../state/workspaceStore";

const PROFILE_EDITING_NOTE = "Profile editing is not yet connected — backed by Supabase in a later step.";

export default function Profile() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const libraryAssets = useLibraryStore((s) => s.assets);
  const chats = useWorkspaceStore((s) => s.chats);
  const promptsHistory = usePromptsStore((s) => s.history);

  const generationCount = chats.reduce((sum, chat) => sum + chat.history.length, 0);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Account";
  const email = user?.email ?? "";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const initial = displayName.charAt(0).toUpperCase() || "S";

  return (
    <PageContainer
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      actions={
        <button
          type="button"
          disabled
          title={PROFILE_EDITING_NOTE}
          className="app-btn-primary h-9 cursor-not-allowed opacity-50"
        >
          {t("profile.saveChanges")}
        </button>
      }
    >
      <div className="rounded-card token-card border border-[var(--border-primary)] px-6 shadow-flat-sm">
        <SettingsSection title={t("profile.account")} description={t("profile.accountDesc")}>
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-poppins text-xl font-semibold text-primary overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-poppins text-sm font-semibold text-text">{displayName}</span>
              {email && (
                <span className="font-codec text-xs text-text/60">{email}</span>
              )}
            </div>
            <button
              type="button"
              disabled
              title={PROFILE_EDITING_NOTE}
              className="app-btn-ghost ml-auto h-9 cursor-not-allowed px-3 text-xs opacity-50"
            >
              {t("profile.changeAvatar")}
            </button>
          </div>
          <p className="font-codec text-[11px] italic text-[var(--text-muted)]">
            {PROFILE_EDITING_NOTE}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("profile.displayName")}>
              <input className="app-input" defaultValue={displayName} readOnly />
            </Field>
            <Field label={t("profile.email")}>
              <input className="app-input" defaultValue={email} type="email" readOnly />
            </Field>
            <Field label={t("profile.workspace")}>
              <input className="app-input" defaultValue="SoundAI · Studio" readOnly />
            </Field>
            <Field label={t("profile.role")}>
              <input className="app-input" defaultValue="Producer" readOnly />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection title={t("profile.stats")} description={t("profile.statsDesc")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Stat label={t("profile.generations")} value={String(generationCount)} />
            <Stat label={t("profile.savedPrompts")} value={String(promptsHistory.length)} />
            <Stat label={t("profile.libraryAssets")} value={String(libraryAssets.length)} />
          </div>
        </SettingsSection>

        <SettingsSection title={t("profile.payment")} description={t("profile.paymentDesc")}>
          <div className="rounded-card border border-dashed border-[var(--border-primary)] bg-[var(--surface-secondary)] p-6 text-center">
            <p className="font-codec text-sm text-[var(--text-secondary)]">
              Payment methods are not yet available.
            </p>
            <p className="mt-1 font-codec text-[12px] text-[var(--text-muted)]">
              Stripe-dependent — card management will appear here once billing is connected.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection title={t("profile.notifications")} description={t("profile.notificationsDesc")}>
          <NotificationToggles />
        </SettingsSection>
      </div>
    </PageContainer>
  );
}

function NotificationToggles() {
  const [generationsEmail, setGenerationsEmail] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [pushInApp, setPushInApp] = useState(true);
  const [collabMentions, setCollabMentions] = useState(true);

  return (
    <>
      <Toggle
        label="Generation complete (email)"
        description="Get an email when a long-running render finishes."
        checked={generationsEmail}
        onChange={setGenerationsEmail}
      />
      <Toggle
        label="Product updates"
        description="Occasional updates about new models and features."
        checked={productUpdates}
        onChange={setProductUpdates}
      />
      <Toggle
        label="Billing alerts"
        description="Payment receipts and upcoming renewal reminders."
        checked={billingAlerts}
        onChange={setBillingAlerts}
      />
      <Toggle
        label="In-app notifications"
        description="Show push toasts inside the dashboard."
        checked={pushInApp}
        onChange={setPushInApp}
      />
      <Toggle
        label="Collaboration mentions"
        description="Notify me when a teammate @mentions me in a session."
        checked={collabMentions}
        onChange={setCollabMentions}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-surface bg-surface-muted p-4">
      <div className="font-codec text-xs font-medium text-text/60">{label}</div>
      <div className="mt-1 font-poppins text-2xl font-semibold text-text">{value}</div>
    </div>
  );
}
