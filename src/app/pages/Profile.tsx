import { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import PageContainer from "../components/PageContainer";
import { Field, SettingsSection, Toggle } from "../components/SettingsForm";
import { useLanguage } from "../i18n/LanguageProvider";

interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const initialCards: PaymentCard[] = [
  { id: "c1", brand: "Visa", last4: "4242", expiry: "09/27", isDefault: true },
  { id: "c2", brand: "Mastercard", last4: "1881", expiry: "03/26", isDefault: false },
];

export default function Profile() {
  const { t } = useLanguage();
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);
  const [generationsEmail, setGenerationsEmail] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [billingAlerts, setBillingAlerts] = useState(true);
  const [pushInApp, setPushInApp] = useState(true);
  const [collabMentions, setCollabMentions] = useState(true);

  const addCard = () => {
    const id = `c${Math.random().toString(36).slice(2, 8)}`;
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    setCards((prev) => [
      ...prev,
      { id, brand: "Visa", last4, expiry: "12/28", isDefault: prev.length === 0 },
    ]);
  };

  const removeCard = (id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length && !next.some((c) => c.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  };

  const makeDefault = (id: string) => {
    setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  return (
    <PageContainer
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      actions={<button className="app-btn-primary h-9">{t("profile.saveChanges")}</button>}
    >
      <div className="rounded-card token-card border border-[var(--border-primary)] px-6 shadow-flat-sm">
        <SettingsSection title={t("profile.account")} description={t("profile.accountDesc")}>
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-poppins text-xl font-semibold text-primary">
              DM
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-poppins text-sm font-semibold text-text">Dmitriy M.</span>
              <span className="font-codec text-xs text-text/60">dmitriy@soundai.studio</span>
            </div>
            <button className="app-btn-ghost ml-auto h-9 px-3 text-xs">{t("profile.changeAvatar")}</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("profile.displayName")}>
              <input className="app-input" defaultValue="Dmitriy M." />
            </Field>
            <Field label={t("profile.email")}>
              <input className="app-input" defaultValue="dmitriy@soundai.studio" type="email" />
            </Field>
            <Field label={t("profile.workspace")}>
              <input className="app-input" defaultValue="SoundAI · Studio" />
            </Field>
            <Field label={t("profile.role")}>
              <input className="app-input" defaultValue="Producer" />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection title={t("profile.stats")} description={t("profile.statsDesc")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Stat label={t("profile.generations")} value="312" />
            <Stat label={t("profile.savedPrompts")} value="46" />
            <Stat label={t("profile.libraryAssets")} value="128" />
          </div>
        </SettingsSection>

        <SettingsSection title={t("profile.payment")} description={t("profile.paymentDesc")}>
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 rounded-card border border-surface p-3"
              >
                <div className="flex h-10 w-14 items-center justify-center rounded-input bg-surface-muted">
                  <CreditCard className="h-4 w-4 text-text/60" />
                </div>
                <div className="flex-1">
                  <div className="font-poppins text-sm font-medium text-text">
                    {card.brand} •••• {card.last4}
                  </div>
                  <div className="app-meta">Expires {card.expiry}</div>
                </div>
                {card.isDefault ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-poppins text-[11px] font-medium text-primary">
                    {t("profile.default")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeDefault(card.id)}
                    className="app-btn-ghost h-9 px-3 text-xs"
                  >
                    {t("profile.makeDefault")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeCard(card.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-button text-text/60 transition-colors hover:bg-surface hover:text-primary"
                  aria-label="Remove card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="rounded-card border border-dashed border-surface p-6 text-center font-codec text-sm text-text/60">
                No payment methods yet.
              </div>
            )}
          </div>
          <button type="button" onClick={addCard} className="app-btn-ghost h-9 self-start px-4">
            <Plus className="h-3.5 w-3.5" /> {t("profile.addPayment")}
          </button>
        </SettingsSection>

        <SettingsSection title={t("profile.notifications")} description={t("profile.notificationsDesc")}>
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
        </SettingsSection>
      </div>
    </PageContainer>
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
