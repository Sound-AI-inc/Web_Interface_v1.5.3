import BillingCard from "./BillingCard";
import { plans } from "../data/mock";

export default function UpgradePlanModalContent() {
  return (
    <div className="rounded-card border border-surface bg-white shadow-flat-sm">
      <div className="border-b border-surface px-5 py-4">
        <h2 className="font-poppins text-lg font-semibold text-text">Upgrade Plan</h2>
        <p className="app-meta mt-1">
          Compare plans and unlock more generations, formats and pro workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
        {plans.map((plan) => (
          <BillingCard key={plan.id} plan={plan} current={false} />
        ))}
      </div>
    </div>
  );
}
