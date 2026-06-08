import BillingCard from "./BillingCard";
import { plans } from "../data/mock";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import { grantPlanCredits } from "../lib/creditsService";
import { useLanguage } from "../i18n/LanguageProvider";

export default function UpgradePlanModalContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { applyGrant, refresh } = useCredits();

  const handleSubscribe = async (planId: string, packageCredits?: number) => {
    if (!user) return;
    const grant = await grantPlanCredits(user.id, planId, packageCredits);
    applyGrant(grant.balance, grant.quota);
    await refresh();
  };

  return (
    <div className="rounded-card border border-[var(--border-primary)] bg-[var(--surface-modal)]">
      <div className="border-b border-[var(--border-primary)] px-5 py-4">
        <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
          {t("upgrade.title")}
        </h2>
        <p className="app-meta mt-1">{t("upgrade.subtitle")}</p>
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
