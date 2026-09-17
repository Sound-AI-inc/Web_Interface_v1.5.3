import { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BillingCard from "../components/BillingCard";
import BillingComparisonTable from "../components/BillingComparisonTable";
import { plans } from "../data/mock";
import { useAuth } from "../hooks/useAuth";
import { useCredits } from "../hooks/useCredits";
import { fetchUserCredits } from "../lib/creditsService";
import { useToast } from "../components/Toast";
import { useLanguage } from "../i18n/LanguageProvider";

const STRIPE_NOTICE =
  "Stripe billing is not yet connected. Checkout will become available when billing is enabled.";

export default function Billing() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { remaining, total } = useCredits();
  const { notify } = useToast();
  const [serverPlan, setServerPlan] = useState<string | null>(null);
  const [resetAt, setResetAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setServerPlan(null);
      setResetAt(null);
      return;
    }
    let cancelled = false;
    void fetchUserCredits(user.id).then((credits) => {
      if (cancelled || !credits) return;
      setServerPlan(credits.plan);
      setResetAt(credits.resetAt);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const usedCredits = Math.max(0, total - remaining);
  const totalCredits = total;
  const pct = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  const currentPlan = plans.find((p) => p.id === serverPlan) ?? null;

  // UX-006/007: STRIPE-DEPENDENT preview only. Never grant credits or
  // activate subscriptions from the client.
  const handleSubscribe = () => {
    notify(STRIPE_NOTICE, "info");
  };

  const handleManagePlan = () => {
    notify(STRIPE_NOTICE, "info");
  };

  return (
    <PageContainer title={t("billing.title")} subtitle={t("billing.subtitle")}>
      <div className="pb-10">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="token-card rounded-card p-5">
            <div className="app-section-title mb-2">{t("billing.currentPlan")}</div>
            <div className="font-poppins text-xl font-semibold text-[var(--text-primary)]">
              {currentPlan ? currentPlan.name : (serverPlan ?? "Free")}
            </div>
            <p className="app-meta mt-1">
              {resetAt
                ? `Renews ${new Date(resetAt).toLocaleDateString()}`
                : "Plan status synced from the server"}
            </p>
            <button
              type="button"
              onClick={handleManagePlan}
              title={STRIPE_NOTICE}
              className="app-btn-ghost mt-4 h-9 w-full"
            >
              {t("billing.managePlan")}
            </button>
            <p className="mt-2 font-codec text-[11px] italic text-[var(--text-muted)]">
              Stripe-dependent — plan changes are not yet available.
            </p>
          </div>
          <div className="token-card rounded-card p-5 md:col-span-2">
            <div className="app-section-title mb-2">{t("billing.credits")}</div>
            <div className="flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-semibold text-[var(--text-primary)]">
                {remaining}
              </span>
              <span className="font-codec text-sm text-[var(--text-secondary)]">
                / {totalCredits} {t("billing.creditsSuffix")}
              </span>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-[var(--surface-secondary)]">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="app-meta mt-2">{t("billing.resets")}</p>
          </div>
        </div>

        <h2 className="app-section-title mb-4">{t("billing.plans")}</h2>
        <div className="mb-4 rounded-[12px] border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2.5 font-codec text-[12px] leading-5 text-[var(--text-secondary)]">
          Plan comparison is a preview. {STRIPE_NOTICE}
        </div>
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <BillingCard
              key={p.id}
              plan={p}
              current={serverPlan ? p.id === serverPlan : false}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        <h2 className="app-section-title mb-4 mt-10">{t("billing.comparePlans")}</h2>
        <BillingComparisonTable />

        <h2 className="app-section-title mb-4 mt-10">{t("billing.recentInvoices")}</h2>
        <div className="token-card rounded-card border border-dashed border-[var(--border-primary)] p-8 text-center">
          <p className="font-codec text-sm text-[var(--text-secondary)]">
            No invoices yet.
          </p>
          <p className="mt-1 font-codec text-[12px] text-[var(--text-muted)]">
            Billing history will appear here once Stripe billing is connected.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
