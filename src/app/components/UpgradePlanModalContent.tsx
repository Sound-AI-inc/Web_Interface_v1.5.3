import BillingCard from "./BillingCard";
import { plans } from "../data/mock";
import { useToast } from "./Toast";
import { useLanguage } from "../i18n/LanguageProvider";

export default function UpgradePlanModalContent() {
  const { t } = useLanguage();
  const { notify } = useToast();

  // UX-006/007: STRIPE-DEPENDENT preview only. Previously this granted
  // credits client-side as a fake subscription mechanism — removed.
  const handleSubscribe = () => {
    notify(
      "Stripe billing is not yet connected. Checkout will become available when billing is enabled.",
      "info",
    );
  };

  return (
    <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)]">
      <div className="border-b border-[var(--border-primary)] px-5 py-4">
        <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
          {t("upgrade.title")}
        </h2>
        <p className="app-meta mt-1">{t("upgrade.subtitle")}</p>
        <p className="mt-2 font-codec text-[12px] italic text-[var(--text-muted)]">
          Preview only — Stripe checkout is not yet connected.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
        {plans.map((plan) => (
          <BillingCard
            key={plan.id}
            plan={plan}
            current={false}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  );
}
