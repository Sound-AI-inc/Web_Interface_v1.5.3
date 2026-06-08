import PageContainer from "../components/PageContainer";
import BillingCard from "../components/BillingCard";
import BillingComparisonTable from "../components/BillingComparisonTable";
import { plans } from "../data/mock";
import { useLanguage } from "../i18n/LanguageProvider";

export default function Billing() {
  const { t } = useLanguage();
  const usedCredits = 58;
  const totalCredits = 100;
  const pct = (usedCredits / totalCredits) * 100;

  return (
    <PageContainer title={t("billing.title")} subtitle={t("billing.subtitle")}>
      <div className="pb-10">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="token-card rounded-card p-5">
            <div className="app-section-title mb-2">{t("billing.currentPlan")}</div>
            <div className="font-poppins text-xl font-semibold text-[var(--text-primary)]">Standard</div>
            <p className="app-meta mt-1">Renews on May 14</p>
            <button className="app-btn-ghost mt-4 h-9 w-full">{t("billing.managePlan")}</button>
          </div>
          <div className="token-card rounded-card p-5 md:col-span-2">
            <div className="app-section-title mb-2">{t("billing.credits")}</div>
            <div className="flex items-baseline gap-2">
              <span className="font-poppins text-3xl font-semibold text-[var(--text-primary)]">{usedCredits}</span>
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
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <BillingCard key={p.id} plan={p} current={p.id === "free"} />
          ))}
        </div>

        <h2 className="app-section-title mb-4 mt-10">{t("billing.comparePlans")}</h2>
        <BillingComparisonTable />

        <h2 className="app-section-title mb-4 mt-10">{t("billing.recentInvoices")}</h2>
        <div className="token-card overflow-hidden rounded-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t("billing.colDate")}
                </th>
                <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t("billing.colPlan")}
                </th>
                <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t("billing.colAmount")}
                </th>
                <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t("billing.colStatus")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Apr 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
                { date: "Mar 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
                { date: "Feb 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
              ].map((r) => (
                <tr key={r.date} className="border-b border-[var(--border-primary)] last:border-0">
                  <td className="px-5 py-3 font-codec text-sm text-[var(--text-primary)]">{r.date}</td>
                  <td className="px-5 py-3 font-codec text-sm text-[var(--text-secondary)]">{r.plan}</td>
                  <td className="px-5 py-3 font-codec text-sm text-[var(--text-secondary)]">{r.amount}</td>
                  <td className="px-5 py-3 font-codec text-sm">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-poppins text-[11px] font-medium text-primary">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
