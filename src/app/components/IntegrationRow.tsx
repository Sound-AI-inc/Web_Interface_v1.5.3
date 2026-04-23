import type { Integration } from "../data/mock";

interface IntegrationRowProps {
  integration: Integration;
}

/**
 * Color chip palette per category so the logo placeholder reads as a brand
 * mark rather than a generic avatar. Each brand gets a distinct gradient
 * derived from its category hue; the monogram keeps the existing
 * `iconLetter` field without needing real SVGs.
 */
const CATEGORY_GRADIENT: Record<Integration["category"], string> = {
  DAW: "from-[#FF3C82] to-[#FF98A8]",
  "AI Tools": "from-[#8A5CF6] to-[#C084FC]",
  Distribution: "from-[#F59E0B] to-[#FCD34D]",
  Samples: "from-[#10B981] to-[#6EE7B7]",
  Storage: "from-[#3B82F6] to-[#93C5FD]",
  Processing: "from-[#EC4899] to-[#F9A8D4]",
};

export default function IntegrationRow({ integration }: IntegrationRowProps) {
  const gradient = CATEGORY_GRADIENT[integration.category];
  return (
    <div className="flex items-center gap-3 rounded-card border border-surface bg-white p-2.5 transition-colors hover:border-primary/30 hover:shadow-flat-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-button bg-gradient-to-br ${gradient} font-poppins text-[11px] font-bold uppercase text-white shadow-sm`}
      >
        {integration.iconLetter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-poppins text-[13px] font-semibold text-text">
            {integration.name}
          </h3>
          {integration.pro && (
            <span className="rounded-full bg-primary/10 px-1.5 py-[1px] font-poppins text-[8px] font-bold uppercase tracking-wider text-primary">
              Pro
            </span>
          )}
        </div>
        <p className="truncate font-codec text-[11px] text-text/60">
          {integration.description}
        </p>
      </div>
      {integration.connected ? (
        <button className="h-7 shrink-0 rounded-button border border-surface bg-surface-muted px-3 font-poppins text-[10px] font-medium uppercase tracking-wider text-text/60 transition-colors hover:bg-surface">
          Connected
        </button>
      ) : (
        <button className="h-7 shrink-0 rounded-button bg-primary px-3 font-poppins text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary/90">
          Connect
        </button>
      )}
    </div>
  );
}
