import type { Integration } from "../data/mock";
import { integrationLogoUrl } from "../lib/integrationLogos";

interface IntegrationRowProps {
  integration: Integration;
}

export default function IntegrationRow({ integration }: IntegrationRowProps) {
  const logoUrl = integrationLogoUrl(integration.id);

  return (
    <div className="flex items-center gap-3 rounded-card border border-[var(--border-primary)] bg-[var(--surface-primary)] p-3 transition-colors hover:border-primary/30 hover:shadow-flat-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-6 w-6 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="font-poppins text-[11px] font-bold uppercase text-[var(--text-primary)]">
            {integration.iconLetter}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-poppins text-[13px] font-semibold text-[var(--text-primary)]">
            {integration.name}
          </h3>
          {integration.pro && (
            <span className="rounded-full bg-primary/10 px-1.5 py-[1px] font-poppins text-[8px] font-bold uppercase tracking-wider text-primary">
              Pro
            </span>
          )}
        </div>
        <p className="truncate font-codec text-[11px] text-[var(--text-muted)]">
          {integration.description}
        </p>
      </div>
      {integration.connected ? (
        <button className="h-7 shrink-0 rounded-button border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-3 font-poppins text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-elevated)]">
          Connected
        </button>
      ) : (
        <button className="h-7 shrink-0 rounded-button bg-primary px-3 font-poppins text-[10px] font-bold uppercase tracking-wider text-on-accent transition-colors hover:bg-primary/90">
          Connect
        </button>
      )}
    </div>
  );
}
