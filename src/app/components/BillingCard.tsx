import { useState } from "react";
import { Check } from "lucide-react";
import type { Plan } from "../data/mock";

interface BillingCardProps {
  plan: Plan;
  current?: boolean;
}

export default function BillingCard({ plan, current }: BillingCardProps) {
  const isHighlight = plan.highlight;
  const [selectedPkg, setSelectedPkg] = useState(
    plan.creditPackages ? plan.creditPackages[0] : undefined,
  );

  const displayPrice = selectedPkg ? `$${selectedPkg.price}` : plan.price;
  const displayCadence = selectedPkg ? `/ ${selectedPkg.credits} credits` : plan.cadence;

  return (
    <div className="flex flex-col gap-5">
      <div
        className={`relative flex flex-col gap-4 rounded-card p-6 ${
          isHighlight
            ? "border-2 border-primary bg-white shadow-flat"
            : "border border-surface bg-white shadow-flat-sm"
        }`}
      >
        {isHighlight && (
          <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-1 font-poppins text-[10px] font-bold uppercase tracking-wider text-white">
            Popular
          </span>
        )}

        <header>
          <h3 className="font-poppins text-base font-semibold text-text">{plan.name}</h3>
        </header>

        <div>
          <div className="font-poppins text-3xl font-semibold text-text">
            {displayPrice}
            {displayCadence && (
              <span className="ml-1 font-codec text-sm font-normal text-text/50">
                {displayCadence}
              </span>
            )}
          </div>
          {plan.description && (
            <p className="mt-2 font-codec text-xs leading-relaxed text-text/60">
              {plan.description}
            </p>
          )}
        </div>

        {plan.creditPackages && selectedPkg && (
          <div>
            <span className="mb-1.5 block font-codec text-[11px] font-medium text-text/60">
              Select credits package
            </span>
            <div className="flex flex-col gap-1">
              {plan.creditPackages.map((pkg) => {
                const active = pkg.credits === selectedPkg.credits;
                return (
                  <button
                    key={pkg.credits}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`flex items-center justify-between rounded-button border px-3 py-2 font-codec text-xs transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/5 text-primary"
                        : "border-surface text-text/70 hover:border-primary/30"
                    }`}
                  >
                    <span>{pkg.credits} credits</span>
                    <span className="font-medium">${pkg.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {plan.pricingNote && (
          <p className="font-codec text-[11px] italic text-text/50">{plan.pricingNote}</p>
        )}
      </div>

      {plan.extras.length > 0 && (
        <div className="rounded-card border border-surface bg-surface-muted p-5">
          <div className="mb-3 font-poppins text-[10px] font-bold uppercase tracking-[0.14em] text-text/60">
            Included benefits
          </div>
          <ul className="flex flex-col gap-2">
            {plan.extras.map((e) => (
              <li key={e} className="font-codec text-xs leading-relaxed text-text/70">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
