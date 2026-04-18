import PageContainer from "../components/PageContainer";
import BillingCard from "../components/BillingCard";
import { plans } from "../data/mock";

export default function Billing() {
  const usedCredits = 58;
  const totalCredits = 100;
  const pct = (usedCredits / totalCredits) * 100;

  return (
    <PageContainer title="Billing" subtitle="Plan, usage and invoices">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-card border border-surface bg-white p-5 shadow-flat-sm">
          <div className="app-section-title mb-2">Current plan</div>
          <div className="font-poppins text-xl font-semibold text-text">Standard</div>
          <p className="app-meta mt-1">Renews on May 14</p>
          <button className="app-btn-ghost mt-4 h-9 w-full">Manage plan</button>
        </div>
        <div className="rounded-card border border-surface bg-white p-5 shadow-flat-sm md:col-span-2">
          <div className="app-section-title mb-2">Credits this month</div>
          <div className="flex items-baseline gap-2">
            <span className="font-poppins text-3xl font-semibold text-text">{usedCredits}</span>
            <span className="font-codec text-sm text-text/50">/ {totalCredits} generations</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="app-meta mt-2">Resets on May 14. Upgrade for more headroom.</p>
        </div>
      </div>

      <h2 className="app-section-title mb-4">Plans</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <BillingCard key={p.id} plan={p} current={p.id === "free"} />
        ))}
      </div>

      <h2 className="app-section-title mb-4 mt-10">Recent invoices</h2>
      <div className="overflow-hidden rounded-card border border-surface bg-white">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-text/50">Date</th>
              <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-text/50">Plan</th>
              <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-text/50">Amount</th>
              <th className="px-5 py-3 font-codec text-xs font-medium uppercase tracking-wider text-text/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: "Apr 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
              { date: "Mar 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
              { date: "Feb 14, 2026", plan: "Standard", amount: "$19.00", status: "Paid" },
            ].map((r) => (
              <tr key={r.date} className="border-b border-surface last:border-0">
                <td className="px-5 py-3 font-codec text-sm text-text">{r.date}</td>
                <td className="px-5 py-3 font-codec text-sm text-text/80">{r.plan}</td>
                <td className="px-5 py-3 font-codec text-sm text-text/80">{r.amount}</td>
                <td className="px-5 py-3 font-codec text-sm">
                  <span className="rounded-full bg-accent-light/40 px-2.5 py-0.5 font-poppins text-[11px] font-medium text-text">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
