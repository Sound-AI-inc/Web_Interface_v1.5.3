import { Check } from "lucide-react";
import type { Plan } from "../data/mock";

interface BillingCardProps {
  plan: Plan;
  current?: boolean;
}

export default function BillingCard({ plan, current }: BillingCardProps) {
  const isHighlight = plan.highlight;
  return (
    <div
      className={`flex flex-col gap-4 rounded-card p-6 ${
        isHighlight
          ? "border-2 border-primary bg-white shadow-flat"
          : "border border-surface bg-white shadow-flat-sm"
      }`}
    >
      <header className="flex items-center justify-between">
        <h3 className="font-poppins text-base font-semibold text-text">{plan.name}</h3>
        {isHighlight && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-poppins text-[11px] font-medium text-primary">
            Popular
          </span>
        )}
      </header>
      <div>
        <div className="font-poppins text-3xl font-semibold text-text">
          {plan.price}
          <span className="ml-1 font-codec text-sm font-normal text-text/50">{plan.cadence}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 font-codec text-sm text-text/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        className={isHighlight ? "app-btn-primary h-10" : "app-btn-ghost h-10"}
        disabled={current}
      >
        {current ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}
